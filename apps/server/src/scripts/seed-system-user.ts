import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  SYSTEM_USER_ID,
  SYSTEM_USER_EMAIL,
  SYSTEM_USER_NAME,
} from "../modules/support/support.constants";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/**
 * Idempotently seeds the non-login SYSTEM user used as the sender of automated
 * support messages (REQ-003/REQ-061). Safe to run multiple times.
 *
 * Least-privilege: role CUSTOMER. The user has no Account/Session, so it cannot
 * be logged into via better-auth; it exists only to satisfy `Message.senderId`.
 */
async function main() {
  console.log(`Seeding SYSTEM user (${SYSTEM_USER_ID})...`);
  try {
    const user = await prisma.user.upsert({
      where: { id: SYSTEM_USER_ID },
      update: { name: SYSTEM_USER_NAME, email: SYSTEM_USER_EMAIL },
      create: {
        id: SYSTEM_USER_ID,
        name: SYSTEM_USER_NAME,
        email: SYSTEM_USER_EMAIL,
        emailVerified: true,
        role: UserRole.CUSTOMER,
        isActive: true,
      },
    });
    console.log(`SYSTEM user ready: ${user.id} <${user.email}>`);
  } catch (error) {
    console.error("Failed to seed SYSTEM user:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
