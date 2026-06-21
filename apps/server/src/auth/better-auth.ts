import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
const isDev = process.env.NODE_ENV !== "production";
if (isDev) console.log("BETTER_AUTH_URL:", process.env.BETTER_AUTH_URL);
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { phoneNumber } from "better-auth/plugins";
import type { PrismaClient } from "@prisma/client";
import * as nodemailer from "nodemailer";
import { dash, sentinel } from "@better-auth/infra";

const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: smtpPort,
  secure: smtpPort === 465, // true for 465 (implicit TLS), false for 587 (STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Reuse connections instead of opening a fresh TLS handshake per email.
  // Gmail throttles new connections, so pooling removes the per-send latency
  // and the connection timeouts that caused verification emails to silently fail.
  pool: true,
  maxConnections: 3,
  maxMessages: 100,
  connectionTimeout: 10_000, // fail fast instead of hanging on a stalled connection
  greetingTimeout: 10_000,
  socketTimeout: 20_000,
});

// Surface SMTP misconfiguration at startup instead of discovering it only when
// a fire-and-forget sendMail rejects into a swallowed .catch().
transporter.verify().then(
  () => {
    if (isDev) console.log("SMTP transporter verified and ready");
  },
  (error) => console.error("SMTP transporter verification failed:", error?.message || error)
);

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
          if (isDev) {
            console.log(
              `\n\n=== SMS GATEWAY ===\nTo: ${phoneNumber}\nMessage: Your BexieMart verification code is: ${code}\n===================\n\n`
            );
          }
          if (process.env.ARKESEL_API_KEY) {
            fetch("https://sms.arkesel.com/api/v2/sms/send", {
              method: "POST",
              headers: {
                "api-key": process.env.ARKESEL_API_KEY,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                sender: process.env.ARKESEL_SENDER_ID || "BexieMart",
                message: `Your BexieMart verification code is: ${code}`,
                recipients: [phoneNumber],
              }),
            })
              .then(async (response) => {
                const data = await response.json();
                if (!response.ok || data.status === "error") {
                  console.error("Arkesel SMS Failed:", data);
                } else {
                  console.log("Arkesel SMS Sent successfully:", data);
                }
              })
              .catch((error) => {
                console.error("Arkesel SMS Error:", error);
              });
          } else {
            console.warn("ARKESEL_API_KEY not set, SMS was not sent to the real provider.");
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
        const webUrl = url.replace("localhost", "172.20.10.2");
        const appUrl = `bexiemart://verify-email?token=${token}`;
        if (isDev) {
          console.log(
            `\n\n=== EMAIL VERIFICATION ===\nTo: ${user.email}\nWeb: ${webUrl}\nApp: ${appUrl}\n==========================\n\n`
          );
        }

        // Fire and forget: Do not await this promise so the auth API responds immediately
        transporter
          .sendMail({
            from: process.env.EMAIL_FROM || "BexieMart <onboarding@bexiemart.com>",
            to: user.email,
            subject: "Verify your BexieMart Email",
            html: `
            <p>Hi ${user.name},</p>
            <p>Click the button below to verify your email:</p>
            <br/>
            <a href="${webUrl}" style="display:inline-block;padding:14px 32px;background-color:#004CFF;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
              Verify Email
            </a>
            <br/><br/>
            <p style="color:#64748B;font-size:14px;">
              If the button above doesn't work, copy this link into your browser:<br/>
              <a href="${webUrl}" style="color:#004CFF;">${webUrl}</a>
            </p>
            <br/>
            <p style="color:#64748B;font-size:13px;">
              <strong>Already have the app installed?</strong><br/>
              <a href="${appUrl}" style="color:#64748B;">bexiemart://verify-email?token=${token}</a>
            </p>
          `,
          })
          .then((info) => console.log("Email sent successfully via Nodemailer:", info.messageId))
          .catch((error) => console.error("Failed to send email via Nodemailer:", error));
      },
    },
    session: {
      expiresIn: 7 * 24 * 60 * 60,
    },
    trustedOrigins: ["bexiemart://", "com.bexiemart.app://", "exp://"],
  });
}
