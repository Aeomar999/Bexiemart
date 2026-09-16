import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
const isDev = process.env.NODE_ENV !== "production";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { phoneNumber, bearer, twoFactor } from "better-auth/plugins";
import type { PrismaClient } from "@prisma/client";
import { dash, sentinel } from "@better-auth/infra";
import * as crypto from "crypto";
import { Logger } from "@nestjs/common";
import { mailTransporter } from "./mail-transporter";
import { sendOtpDualChannel } from "./otp-notification.service";
import { buildEmailVerifyHtml } from "./templates/email-verify.template";

const logger = new Logger("BetterAuth");

function generateSecureOtp(): string {
  const code = crypto.randomInt(100000, 999999);
  return code.toString();
}

export function createAuth(prisma: PrismaClient) {
  const betterAuthUrl = process.env.BETTER_AUTH_URL;
  if (!betterAuthUrl) {
    throw new Error("BETTER_AUTH_URL is required");
  }

  const betterAuthApiKey = process.env.BETTER_AUTH_API_KEY;
  if (!betterAuthApiKey) {
    throw new Error("BETTER_AUTH_API_KEY is required");
  }

  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    baseURL: `${betterAuthUrl}/api/v1/auth`,
    plugins: [
      bearer(),
      twoFactor({ issuer: "BexieMart" }),
      dash({
        ...(process.env.BETTER_AUTH_API_URL ? { apiUrl: process.env.BETTER_AUTH_API_URL } : {}),
        ...(process.env.BETTER_AUTH_KV_URL ? { kvUrl: process.env.BETTER_AUTH_KV_URL } : {}),
        apiKey: betterAuthApiKey,
      }),
      sentinel({
        ...(process.env.BETTER_AUTH_API_URL ? { apiUrl: process.env.BETTER_AUTH_API_URL } : {}),
        ...(process.env.BETTER_AUTH_KV_URL ? { kvUrl: process.env.BETTER_AUTH_KV_URL } : {}),
        apiKey: betterAuthApiKey,
        security: {
          credentialStuffing: {
            enabled: true,
            thresholds: { challenge: 3, block: 5 },
          },
        },
      }),
      phoneNumber({
        sendOTP: async ({ phoneNumber, code }) => {
          let user = await prisma.user.findUnique({
            where: { phoneNumber },
            select: { email: true, name: true },
          });

          if (!user) {
            const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
            const suffix = cleanPhone.length >= 9 ? cleanPhone.slice(-9) : cleanPhone;
            user = await prisma.user.findFirst({
              where: {
                phoneNumber: {
                  endsWith: suffix,
                },
              },
              select: { email: true, name: true },
            });
          }

          const result = await sendOtpDualChannel({
            phoneNumber,
            code,
            email: user?.email,
            userName: user?.name,
          });

          if (!result.smsSuccess && !result.emailSuccess) {
            throw new Error("Failed to deliver OTP via any channel");
          }
        },
      }),
    ],
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      requireEmailVerification: true,
    },
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url, token }, request) => {
        const webUrl =
          isDev && process.env.DEV_EMAIL_HOST
            ? url.replace("localhost", process.env.DEV_EMAIL_HOST)
            : url;
        const appUrl = `bexiemart://verify-email?token=${token}`;

        const emailOtpCode = generateSecureOtp();
        const cuid = crypto.randomUUID();

        await prisma.verification.create({
          data: {
            id: cuid,
            identifier: `email-otp:${user.email}`,
            value: emailOtpCode,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          },
        });

        if (isDev) {
          logger.log(
            `\n\n=== EMAIL VERIFICATION ===\nTo: ${user.email}\nWeb: ${webUrl}\nApp: ${appUrl}\nOTP: ${emailOtpCode}\n==========================\n\n`
          );
        }

        const html = buildEmailVerifyHtml({
          userName: user.name,
          verifyUrl: webUrl,
          otpCode: emailOtpCode,
          token,
        });

        try {
          const info = await mailTransporter.sendMail({
            from: process.env.EMAIL_FROM || "BexieMart <onboarding@bexiemart.com>",
            to: user.email,
            subject: "Verify your BexieMart Email",
            html,
          });
          if (isDev) logger.log(`Email sent successfully: ${info.messageId}`);
        } catch (error) {
          logger.error("[EmailVerification] Failed to send email:", error as Error);
        }
      },
    },
    session: {
      expiresIn: 7 * 24 * 60 * 60, // 7 days
      updateAge: 24 * 60 * 60, // 1 day sliding window refresh
    },
    advanced: {
      cookiePrefix: "bx_auth",
      useSecureCookies: !isDev,
    },
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["google"],
      },
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      },
    },
    trustedOrigins: [
      "bexiemart://",
      "com.bexiemart.app://",
      "exp://",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:8081",
      "https://bexiemart.com",
      "https://admin.bexiemart.com",
      "https://api.bexiemart.com",
      ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS
        ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",")
            .map((origin) => origin.trim())
            .filter(Boolean)
        : []),
    ],
  });
}
