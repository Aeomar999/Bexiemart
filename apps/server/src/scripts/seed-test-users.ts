import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Logger } from "@nestjs/common";
import { createAuth } from "../auth/better-auth";
import { Pool } from "pg";

const logger = new Logger("SeedTestUsers");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const auth = createAuth(prisma);

async function createTestUser(
  email: string,
  password: string,
  name: string,
  role: UserRole,
  phone: string
) {
  let user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    logger.log(`User ${email} already exists. Deleting to re-seed...`);
    await prisma.user.delete({ where: { email } });
  }

  logger.log(`Creating user ${email}...`);
  const res = await auth.api.signUpEmail({
    body: { email, password, name, callbackURL: "http://localhost:3000" },
    asResponse: true,
  });
  if (!res.ok) {
    const errData = await res.json();
    throw new Error(`Failed to create user: ${errData.message || JSON.stringify(errData)}`);
  }
  user = await prisma.user.update({
    where: { email },
    data: { role, emailVerified: true, phoneNumber: phone, phoneNumberVerified: true },
  });

  return user;
}

async function main() {
  try {
    // 1. Create Vendor
    const vendorUser = await createTestUser(
      "vendorbexiemart@gmail.com",
      "Password@123",
      "Test Vendor",
      UserRole.VENDOR,
      "+233541234567"
    );

    // Create VendorProfile
    const vp = await prisma.vendorProfile.findUnique({ where: { userId: vendorUser.id } });
    if (!vp) {
      await prisma.vendorProfile.create({
        data: {
          userId: vendorUser.id,
          shopName: "Test Shop",
          slug: "test-shop",
          description: "A shop for testing",
          address: "123 Test St",
          city: "Accra",
          phone: "+233541234567",
          isActive: true,
          taxStatus: "VERIFIED",
        },
      });
      logger.log("Created VendorProfile");
    }

    // 2. Create Dispatcher (Delivery)
    const dispatcherUser = await createTestUser(
      "deliverybexiemart@gmail.com",
      "Password@123",
      "Test Dispatcher",
      UserRole.DISPATCHER,
      "+233541234568"
    );

    // Create DispatcherProfile
    const dp = await prisma.dispatcherProfile.findUnique({ where: { userId: dispatcherUser.id } });
    if (!dp) {
      await prisma.dispatcherProfile.create({
        data: {
          userId: dispatcherUser.id,
          vehicleType: "bike",
          plateNumber: "GW-1234-22",
          status: "ONLINE",
        },
      });
      logger.log("Created DispatcherProfile");
    }

    logger.log("Successfully seeded test vendor and delivery users.");
  } catch (error) {
    logger.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
