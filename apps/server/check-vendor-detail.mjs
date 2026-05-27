import { PrismaClient } from './node_modules/@prisma/client/index.js';
const prisma = new PrismaClient();

// Check all vendor profiles with user emails
const vps = await prisma.vendorProfile.findMany({
  include: { user: { select: { id: true, email: true, name: true } } }
});
console.log('=== All Vendor Profiles ===');
for (const vp of vps) {
  console.log(`  ID: ${vp.id}`);
  console.log(`  UserId: ${vp.userId}`);
  console.log(`  Shop: ${vp.shopName}`);
  console.log(`  User email: ${vp.user.email}`);
  console.log(`  User name: ${vp.user.name}`);
  
  // Check products for this vendor
  const products = await prisma.product.findMany({
    where: { vendorId: vp.id },
    include: { images: true }
  });
  console.log(`  Products: ${products.length}`);
  for (const p of products) {
    console.log(`    - ${p.name} (${p.id}), images: ${p.images.length}`);
  }
  console.log('');
}

// Also check if there are any products with vendorId not matching any profile
const orphanProducts = await prisma.product.findMany({
  where: { vendor: null }
});
console.log('=== Orphan Products (no vendor) ===');
console.log('Count:', orphanProducts.length);

// Check the Better Auth session to see how user IDs match
console.log('\n=== Better Auth Users ===');
const users = await prisma.user.findMany({
  where: { role: 'vendor' },
  select: { id: true, email: true, name: true, role: true }
});
console.log('Vendor users count:', users.length);
for (const u of users) {
  const vp = await prisma.vendorProfile.findUnique({ where: { userId: u.id } });
  console.log(`  ${u.name} (${u.email}): id=${u.id}, hasVendorProfile=${!!vp}`);
}

await prisma.$disconnect();
