import { PrismaClient, UserRole } from "@prisma/client";
import { createAuth } from "../auth/better-auth";

const prisma = new PrismaClient();
const auth = createAuth(prisma);

async function main() {
  const email = process.env.ADMIN_EMAIL || "jerry.amoah@kredibble.co";
  const password = process.env.ADMIN_PASSWORD || "@$#%Jerry12";
  const name = process.env.ADMIN_NAME || "Super Admin";

  console.log(`Starting admin bootstrap for ${email}...`);

  try {
    // 1. Check if user already exists
    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      console.log("User already exists. Updating role to ADMIN...");
      user = await prisma.user.update({
        where: { email },
        data: { role: UserRole.ADMIN, emailVerified: true },
      });
      console.log(`Successfully upgraded ${email} to ADMIN.`);
    } else {
      console.log("User does not exist. Creating new account via better-auth...");

      // 2. Create the user using better-auth so the password is encrypted correctly
      const res = await auth.api.signUpEmail({
        body: { email, password, name, callbackURL: "http://localhost:3001" },
        asResponse: true,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(`Failed to create user: ${errData.message || JSON.stringify(errData)}`);
      }

      // 3. Update the user role to ADMIN and force verify email in Prisma
      console.log("User created. Escalating privileges to ADMIN...");
      user = await prisma.user.update({
        where: { email },
        data: { role: UserRole.ADMIN, emailVerified: true },
      });

      console.log(`Successfully bootstrapped super-admin: ${email}`);
    }
  } catch (error) {
    console.error("Failed to seed admin:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
