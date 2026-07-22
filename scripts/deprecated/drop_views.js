const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe('DROP VIEW IF EXISTS "user" CASCADE;');
  await prisma.$executeRawUnsafe('DROP VIEW IF EXISTS "session" CASCADE;');
  await prisma.$executeRawUnsafe('DROP VIEW IF EXISTS "account" CASCADE;');
  await prisma.$executeRawUnsafe('DROP VIEW IF EXISTS "verification" CASCADE;');
  console.log('Views dropped');
}

main().catch(console.error).finally(() => prisma.$disconnect());
