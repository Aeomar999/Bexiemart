import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Logger } from "@nestjs/common";
import { createAuth } from "../auth/better-auth";

const logger = new Logger("SeedAdmin");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const auth = createAuth(prisma);

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Super Admin";

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set to seed an admin");
  }

  logger.log(`Starting admin bootstrap for ${email}...`);

  try {
    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      logger.log("User already exists. Updating role to ADMIN...");
      user = await prisma.user.update({
        where: { email },
        data: { role: UserRole.ADMIN, emailVerified: true, isSuperAdmin: true },
      });
      logger.log(`Successfully upgraded ${email} to ADMIN.`);
    } else {
      logger.log("User does not exist. Creating new account via better-auth...");

      const res = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name,
          callbackURL: process.env.ADMIN_ORIGIN || "http://localhost:3001",
        },
        asResponse: true,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(`Failed to create user: ${errData.message || JSON.stringify(errData)}`);
      }

      logger.log("User created. Escalating privileges to ADMIN...");
      user = await prisma.user.update({
        where: { email },
        data: { role: UserRole.ADMIN, emailVerified: true, isSuperAdmin: true },
      });

      logger.log(`Successfully bootstrapped super-admin: ${email}`);
    }
  } catch (error) {
    logger.error("Failed to seed admin:", error as Error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
