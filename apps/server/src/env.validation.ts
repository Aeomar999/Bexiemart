import { z } from "zod";
import { Logger } from "@nestjs/common";

const isDev = process.env.NODE_ENV !== "production";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),
  BETTER_AUTH_API_KEY: z.string().min(1, "BETTER_AUTH_API_KEY is required"),
  CORS_ORIGIN: z.string().optional(),
  ENFORCE_HTTPS: z.string().optional(),
  DEV_EMAIL_HOST: z.string().optional(),
  CLIENT_URL: z.string().optional(),
  PAYSTACK_SECRET_KEY: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  ARKESEL_API_KEY: z.string().optional(),
  ARKESEL_SENDER_ID: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().default(0.1),
  SENTRY_PROFILES_SAMPLE_RATE: z.coerce.number().default(0.1),
  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().optional(),
  BETTER_AUTH_API_URL: z.string().optional(),
  BETTER_AUTH_KV_URL: z.string().optional(),
  BETTER_AUTH_TRUSTED_ORIGINS: z.string().optional(),
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  REDIS_URL: z.string().optional(),
  DB_POOL_SIZE: z.coerce.number().default(20),
  SLOW_QUERY_THRESHOLD_MS: z.coerce.number().default(200),
});

export type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

export function validateEnv(): Env {
  if (validatedEnv) return validatedEnv;

  const logger = new Logger("EnvValidation");

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.format();
    const missing = Object.entries(formatted)
      .filter(([, v]) => v && "_errors" in v && (v as any)._errors.length > 0)
      .map(([key, v]) => `  ${key}: ${(v as any)._errors.join(", ")}`)
      .join("\n");

    logger.error(`Environment validation failed:\n${missing}`);
    throw new Error(`Missing or invalid environment variables:\n${missing}`);
  }

  validatedEnv = result.data;

  if (isDev) {
    logger.log("Environment validated successfully");
  }

  return validatedEnv;
}
