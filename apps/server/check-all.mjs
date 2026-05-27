import { PrismaClient } from './node_modules/@prisma/client/index.js';
const prisma = new PrismaClient();

// Check users with vendor profiles
const users = await prisma.user.findMany({
  include: { vendorProfile: true }
});
console.log('Users:');
for (const u of users) {
  console.log(`  ${u.id}: ${u.name} (${u.email}), role: ${u.role}, vendorProfileId: ${u.vendorProfile?.id || 'none'}`);
}

// Check products per vendor
const vendors = await prisma.vendorProfile.findMany();
console.log('\nProducts per vendor:');
for (const v of vendors) {
  const count = await prisma.product.count({ where: { vendorId: v.id } });
  const products = await prisma.product.findMany({
    where: { vendorId: v.id },
    include: { images: true }
  });
  console.log(`  Vendor ${v.shopName} (${v.id}): ${count} products`);
  for (const p of products) {
    console.log(`    Product: ${p.name}, Images: ${p.images.length}`);
    for (const img of p.images) {
      console.log(`      URL: ${img.url.substring(0, 60)}...`);
    }
  }
}

await prisma.$disconnect();
