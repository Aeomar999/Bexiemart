import { PrismaClient } from './node_modules/@prisma/client/index.js';
const prisma = new PrismaClient();

const product = await prisma.product.findFirst({
  orderBy: { createdAt: 'desc' },
  include: { images: true, vendor: true }
});
console.log('Product name:', product?.name);
console.log('Vendor ID:', product?.vendorId);
console.log('Vendor shop name:', product?.vendor?.shopName);
console.log('Images count:', product?.images?.length);
console.log('First image URL:', product?.images?.[0]?.url);

const vendors = await prisma.vendorProfile.findMany();
console.log('---');
console.log('Vendors:', vendors.length);
for (const v of vendors) {
  console.log('Vendor:', v.id, v.shopName, 'userId:', v.userId);
}

await prisma.$disconnect();
