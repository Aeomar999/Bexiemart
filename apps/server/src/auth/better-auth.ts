import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
console.log("BETTER_AUTH_URL:", process.env.BETTER_AUTH_URL);
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { phoneNumber } from "better-auth/plugins";
import type { PrismaClient } from "@prisma/client";
import { Resend } from "resend";
import { dash, sentinel } from "@better-auth/infra";

// The user must replace `re_xxxxxxxxx` with their real API key via the .env file.
const resend = new Resend(process.env.RESEND_API_KEY || "re_hZUiH98H_HtH4T2zdX2SBh6t3F4h4VBTC");

export function createAuth(prisma: PrismaClient) {
  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    baseURL: process.env.BETTER_AUTH_URL + "/api/v1/auth",
    plugins: [
      dash({
        ...(process.env.BETTER_AUTH_API_URL ? { apiUrl: process.env.BETTER_AUTH_API_URL } : {}),
        ...(process.env.BETTER_AUTH_KV_URL ? { kvUrl: process.env.BETTER_AUTH_KV_URL } : {}),
        apiKey: process.env.BETTER_AUTH_API_KEY!,
      }),
      sentinel({
        ...(process.env.BETTER_AUTH_API_URL ? { apiUrl: process.env.BETTER_AUTH_API_URL } : {}),
        ...(process.env.BETTER_AUTH_KV_URL ? { kvUrl: process.env.BETTER_AUTH_KV_URL } : {}),
        apiKey: process.env.BETTER_AUTH_API_KEY!,
        security: {
          credentialStuffing: {
            enabled: true,
            thresholds: { challenge: 3, block: 5 },
          },
        },
      }),
      phoneNumber({
        sendOTP: async ({ phoneNumber, code }) => {
          console.log(
            `\n\n=== SMS GATEWAY MOCK ===\nTo: ${phoneNumber}\nMessage: Your BexieMart verification code is: ${code}\n========================\n\n`
          );
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
        console.log(
          `\n\n=== EMAIL VERIFICATION ===\nTo: ${user.email}\nLink: ${url}\n==========================\n\n`
        );
        try {
          const response = await resend.emails.send({
            from: process.env.EMAIL_FROM || "onboarding@resend.dev",
            to: user.email,
            subject: "Verify your BexieMart Email",
            html: `<p>Hi ${user.name},</p><p>Please verify your email address by clicking the link below:</p><br/><a href="${url}">Verify Email</a>`,
          });
          if (response.error) {
            console.error("Resend Error:", response.error);
          } else {
            console.log("Email sent successfully via Resend:", response.data);
          }
        } catch (error) {
          console.error("Failed to send email via Resend:", error);
        }
      },
    },
    session: {
      expiresIn: 7 * 24 * 60 * 60,
    },
    trustedOrigins: ["bexiemart://", "com.bexiemart.app://"],
  });
}
