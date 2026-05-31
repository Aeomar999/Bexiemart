import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";
import { dash, sentinel } from "@better-auth/infra";

const prisma = new PrismaClient();

// The user must replace `re_xxxxxxxxx` with their real API key via the .env file.
const resend = new Resend(process.env.RESEND_API_KEY || 're_hZUiH98H_HtH4T2zdX2SBh6t3F4h4VBTC');

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  plugins: [
    dash({
      apiUrl: process.env.BETTER_AUTH_API_URL,
      kvUrl: process.env.BETTER_AUTH_KV_URL,
      apiKey: process.env.BETTER_AUTH_API_KEY,
    }),
    sentinel({
      apiUrl: process.env.BETTER_AUTH_API_URL,
      kvUrl: process.env.BETTER_AUTH_KV_URL,
      apiKey: process.env.BETTER_AUTH_API_KEY,
      security: {
        credentialStuffing: {
          enabled: true,
          thresholds: { challenge: 3, block: 5 },
        },
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
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: user.email,
        subject: 'Verify your BexieMart Email',
        html: `<p>Hi ${user.name},</p><p>Please verify your email address by clicking the link below:</p><br/><a href="${url}">Verify Email</a>`,
      });
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 7 * 24 * 60 * 60,
      strategy: "jwt",
    },
  },
  trustedOrigins: ["bexiemart://", "com.bexiemart.app://"],
});
