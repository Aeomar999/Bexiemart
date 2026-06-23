// Sentry must be initialized before any other module is imported so its
// instrumentation can patch the libraries it monkey-patches. main.ts imports
// this file first. Initialization is a no-op unless SENTRY_DSN is set.
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import * as Sentry from "@sentry/nestjs";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? "development",
    integrations: [nodeProfilingIntegration()],
    // Keep sampling conservative by default; override via env in production.
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    profilesSampleRate: Number(process.env.SENTRY_PROFILES_SAMPLE_RATE ?? 0.1),
  });
}
