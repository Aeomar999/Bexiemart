const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('Please provide an email address as an argument.');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.error(`User with email ${email} not found.`);
    process.exit(1);
  }

  const updatedUser = await prisma.user.update({
    where: { email },
    data: { role: 'dispatcher' },
  });

  console.log(`✅ Successfully updated ${email} to role 'dispatcher'!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
