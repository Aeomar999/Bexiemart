import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

// In Prisma 7 the datasource `url` is no longer read from schema.prisma.
// CLI commands (db push, migrate, studio) read it from here instead, and the
// runtime client connects via the pg driver adapter (see prisma/prisma.service.ts).
// Prisma 7 also stops auto-loading .env when a config file is present, hence the
// `dotenv/config` import above.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
