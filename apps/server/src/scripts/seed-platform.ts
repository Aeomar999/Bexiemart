import * as dotenv from "dotenv";
dotenv.config();

import {
  PrismaClient,
  UserRole,
  OrderStatus,
  PaymentStatus,
  DeliveryJobType,
  DeliveryJobStatus,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Logger } from "@nestjs/common";
import { createAuth } from "../auth/better-auth";
import { Pool } from "pg";

const logger = new Logger("SeedPlatform");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const auth = createAuth(prisma);

// Unsplash placeholders
const IMG_ELECTRONICS =
  "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=800&auto=format&fit=crop";
const IMG_FASHION =
  "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=800&auto=format&fit=crop";
const IMG_FOOD =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop";
const IMG_SERVICE =
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=800&auto=format&fit=crop";
const IMG_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop";

async function createTestUser(
  email: string,
  password: string,
  name: string,
  role: UserRole,
  phone: string
) {
  let user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    logger.log(`User ${email} already exists. Deleting to re-seed (cascades)...`);
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
    data: {
      role,
      emailVerified: true,
      phoneNumber: phone,
      phoneNumberVerified: true,
      image: IMG_AVATAR,
    },
  });

  return user;
}

async function main() {
  try {
    logger.log("--- PHASE 1: Users & Profiles ---");

    // 1. Vendors
    const techVendorUser = await createTestUser(
      "vendorbexiemart1@gmail.com",
      "Password@123",
      "Tech Haven Owner",
      UserRole.VENDOR,
      "+233540000001"
    );
    const techVendor = await prisma.vendorProfile.create({
      data: {
        userId: techVendorUser.id,
        shopName: "Tech Haven",
        slug: "tech-haven",
        description: "Latest gadgets and electronics.",
        address: "1 Tech Avenue",
        city: "Accra",
        phone: "+233540000001",
        isActive: true,
        taxStatus: "VERIFIED",
        logo: IMG_ELECTRONICS,
        banner: IMG_ELECTRONICS,
      },
    });

    const foodVendorUser = await createTestUser(
      "foodbexiemart2@gmail.com",
      "Password@123",
      "Bexie Bites Owner",
      UserRole.VENDOR,
      "+233540000002"
    );
    const foodVendor = await prisma.vendorProfile.create({
      data: {
        userId: foodVendorUser.id,
        shopName: "Bexie Bites",
        slug: "bexie-bites",
        description: "Delicious fast food and local dishes.",
        address: "42 Food Street",
        city: "Accra",
        phone: "+233540000002",
        isActive: true,
        taxStatus: "VERIFIED",
        logo: IMG_FOOD,
        banner: IMG_FOOD,
      },
    });

    const serviceVendorUser = await createTestUser(
      "cleanbexiemart3@gmail.com",
      "Password@123",
      "Clean Pros Owner",
      UserRole.VENDOR,
      "+233540000003"
    );
    const serviceVendor = await prisma.vendorProfile.create({
      data: {
        userId: serviceVendorUser.id,
        shopName: "Clean Pros",
        slug: "clean-pros",
        description: "Professional cleaning services.",
        address: "10 Clean Way",
        city: "Tema",
        phone: "+233540000003",
        isActive: true,
        taxStatus: "VERIFIED",
        logo: IMG_SERVICE,
        banner: IMG_SERVICE,
      },
    });

    // 2. Dispatchers
    const dispatcherUser = await createTestUser(
      "driverbexiemart4@gmail.com",
      "Password@123",
      "Speedy Delivery",
      UserRole.DISPATCHER,
      "+233540000010"
    );
    const dispatcher = await prisma.dispatcherProfile.create({
      data: {
        userId: dispatcherUser.id,
        vehicleType: "bike",
        plateNumber: "SPEED-1",
        status: "ONLINE",
      },
    });

    // 3. Customers
    const aliceUser = await createTestUser(
      "alicebexiemart5@gmail.com",
      "Password@123",
      "Alice Smith",
      UserRole.CUSTOMER,
      "+233540000020"
    );
    const bobUser = await createTestUser(
      "bobbexiemart6@gmail.com",
      "Password@123",
      "Bob Jones",
      UserRole.CUSTOMER,
      "+233540000021"
    );

    logger.log("--- PHASE 2: E-Commerce Catalog ---");
    const catElectronics = await prisma.category.upsert({
      where: { slug: "electronics" },
      update: {},
      create: { name: "Electronics", slug: "electronics", icon: "laptop" },
    });
    const catFashion = await prisma.category.upsert({
      where: { slug: "fashion" },
      update: {},
      create: { name: "Fashion", slug: "fashion", icon: "shirt" },
    });

    const p1 = await prisma.product.create({
      data: {
        name: "Pro Gaming Laptop",
        slug: "pro-gaming-laptop",
        description: "High performance gaming laptop",
        price: 15000,
        stock: 50,
        categoryId: catElectronics.id,
        vendorId: techVendor.id,
        isFeatured: true,
        images: { create: [{ url: IMG_ELECTRONICS, isPrimary: true }] },
      },
    });

    const p2 = await prisma.product.create({
      data: {
        name: "Wireless Earbuds",
        slug: "wireless-earbuds",
        description: "Noise cancelling wireless earbuds",
        price: 500,
        stock: 200,
        categoryId: catElectronics.id,
        vendorId: techVendor.id,
        images: { create: [{ url: IMG_ELECTRONICS, isPrimary: true }] },
      },
    });

    logger.log("--- PHASE 3: Food & Services ---");
    const f1 = await prisma.foodItem.create({
      data: {
        vendorId: foodVendor.id,
        name: "Spicy Fried Rice",
        description: "Classic fried rice with spicy chicken",
        price: 45.0,
        category: "Main Course",
        imageUrl: IMG_FOOD,
        prepTime: 20,
      },
    });
    const f2 = await prisma.foodItem.create({
      data: {
        vendorId: foodVendor.id,
        name: "Coca Cola 500ml",
        description: "Chilled soda",
        price: 10.0,
        category: "Drinks",
        imageUrl: IMG_FOOD,
        prepTime: 5,
      },
    });

    const s1 = await prisma.service.create({
      data: {
        vendorId: serviceVendor.id,
        name: "Deep Home Cleaning",
        description: "Complete house deep clean",
        price: 300,
        priceDisplay: "GH₵ 300",
        imageUrl: IMG_SERVICE,
        category: "Cleaning",
        rating: 4.8,
        ratingCount: 12,
      },
    });

    logger.log("--- PHASE 4: User Engagements & Orders ---");

    // Address for Alice
    const aliceAddress = await prisma.shippingAddress.create({
      data: {
        userId: aliceUser.id,
        firstName: "Alice",
        lastName: "Smith",
        phone: "+233540000020",
        email: "alicebexiemart5@gmail.com",
        address: "Block B, Tech Park",
        city: "Accra",
        state: "Greater Accra",
        country: "Ghana",
      },
    });

    // Create an Order
    const order = await prisma.order.create({
      data: {
        orderNumber: "ORD-" + Math.floor(Math.random() * 1000000),
        userId: aliceUser.id,
        status: OrderStatus.processing,
        subtotal: 15500,
        shippingFee: 50,
        total: 15550,
        paymentStatus: PaymentStatus.success,
        paymentMethod: "card",
        shippingAddressId: aliceAddress.id,
        items: {
          create: [
            {
              productId: p1.id,
              productName: p1.name,
              productSlug: p1.slug,
              price: p1.price,
              quantity: 1,
              total: p1.price,
              imageUrl: IMG_ELECTRONICS,
            },
            {
              productId: p2.id,
              productName: p2.name,
              productSlug: p2.slug,
              price: p2.price,
              quantity: 1,
              total: p2.price,
              imageUrl: IMG_ELECTRONICS,
            },
          ],
        },
        payment: {
          create: {
            userId: aliceUser.id,
            amount: 15550,
            status: PaymentStatus.success,
            paystackRef: "T-" + Math.floor(Math.random() * 1000000),
            paymentMethod: "card",
          },
        },
      },
    });

    // Delivery Job for that Order
    await prisma.deliveryJob.create({
      data: {
        jobNumber: "JOB-" + Math.floor(Math.random() * 1000000),
        type: DeliveryJobType.ORDER,
        status: DeliveryJobStatus.ASSIGNED,
        customerId: aliceUser.id,
        dispatcherId: dispatcher.id,
        orderId: order.id,
        vehicleType: "bike",
        pickupAddress: techVendor.address || "Vendor Address",
        pickupLat: 5.6037,
        pickupLng: -0.187,
        dropoffAddress: aliceAddress.address,
        dropoffLat: 5.6337,
        dropoffLng: -0.207,
      },
    });

    // Follow and Review
    await prisma.vendorFollow.create({
      data: { userId: aliceUser.id, vendorId: techVendor.id },
    });
    await prisma.review.create({
      data: {
        userId: aliceUser.id,
        productId: p1.id,
        rating: 5,
        comment: "Amazing laptop! Fast delivery.",
      },
    });

    logger.log("Platform seed completed successfully!");
  } catch (error) {
    logger.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
