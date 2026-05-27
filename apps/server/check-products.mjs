import { PrismaClient } from './node_modules/@prisma/client/index.js';
const prisma = new PrismaClient();
const products = await prisma.product.findMany({
  take: 10,
  orderBy: { createdAt: 'desc' },
  include: { images: true }
});
for (const p of products) {
  console.log('Product:', p.id, p.name, 'Images:', p.images.length);
  for (const img of p.images) {
    console.log('  Image URL:', img.url);
  }
}
console.log('---');
console.log('Total products:', await prisma.product.count());
console.log('Total product images:', await prisma.productImage.count());
await prisma.$disconnect();
