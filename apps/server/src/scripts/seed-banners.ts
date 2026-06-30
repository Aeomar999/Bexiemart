import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient, BannerPlacement, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/**
 * Idempotently seeds the initial promotional banners. These mirror the content
 * that previously lived as hardcoded arrays inside the mobile home/food/services
 * screens, now promoted to real DB rows so the carousels are backend-driven and
 * admin-manageable. Safe to run multiple times (upsert by deterministic id).
 */
const IMG = "?q=80&w=800&auto=format&fit=crop";

const BANNERS: Prisma.BannerCreateInput[] = [
  // ─── Home ──────────────────────────────────────────────────────────────────
  {
    id: "seed-home-1",
    placement: BannerPlacement.HOME,
    title: "Holiday Deals Are Live!",
    subtitle: "Up to 50% off",
    badge: "Limited Offer",
    imageUrl: `https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da${IMG}`,
    ctaLabel: "Order Now",
    ctaRoute: "/(customer)/flash-sales",
    sortOrder: 0,
  },
  {
    id: "seed-home-2",
    placement: BannerPlacement.HOME,
    title: "Fresh Groceries",
    subtitle: "Delivered in 30 mins",
    imageUrl: `https://images.unsplash.com/photo-1542838132-92c53300491e${IMG}`,
    ctaLabel: "Shop Now",
    ctaRoute: "/(customer)/(shop)",
    sortOrder: 1,
  },
  {
    id: "seed-home-3",
    placement: BannerPlacement.HOME,
    title: "New Fashion Drops",
    subtitle: "Shop latest trends",
    imageUrl: `https://images.unsplash.com/photo-1441984904996-e0b6ba687e04${IMG}`,
    ctaLabel: "Shop Now",
    ctaRoute: "/(customer)/(shop)",
    sortOrder: 2,
  },

  // ─── Food ──────────────────────────────────────────────────────────────────
  {
    id: "seed-food-1",
    placement: BannerPlacement.FOOD,
    title: "Free Delivery",
    subtitle: "On your first 3 food orders!",
    imageUrl: `https://images.unsplash.com/photo-1504674900247-0877df9cc836${IMG}`,
    ctaLabel: "Order Now",
    ctaRoute: "/(customer)/food",
    sortOrder: 0,
  },
  {
    id: "seed-food-2",
    placement: BannerPlacement.FOOD,
    title: "50% Off KFC",
    subtitle: "Valid until 8 PM today",
    badge: "Today Only",
    imageUrl: `https://images.unsplash.com/photo-1513104890138-7c749659a591${IMG}`,
    ctaLabel: "Order Now",
    ctaRoute: "/(customer)/food",
    sortOrder: 1,
  },

  // ─── Services ────────────────────────────────────────────────────────────────
  {
    id: "seed-services-1",
    placement: BannerPlacement.SERVICES,
    title: "Expert Services",
    subtitle: "Verified professionals at your doorstep within 2 hours.",
    imageUrl: `https://images.unsplash.com/photo-1581578731548-c64695cc6952${IMG}`,
    ctaLabel: "Book Now",
    ctaRoute: "/(customer)/services",
    sortOrder: 0,
  },
  {
    id: "seed-services-2",
    placement: BannerPlacement.SERVICES,
    title: "Home Deep Clean",
    subtitle: "Get 20% off your first whole-house deep clean.",
    badge: "20% Off",
    imageUrl: `https://images.unsplash.com/photo-1563453392212-326f5e854473${IMG}`,
    ctaLabel: "Book Now",
    ctaRoute: "/(customer)/services",
    sortOrder: 1,
  },
];

async function main() {
  console.log(`Seeding ${BANNERS.length} promotional banners...`);
  try {
    for (const banner of BANNERS) {
      const { id, ...rest } = banner;
      await prisma.banner.upsert({
        where: { id: id as string },
        update: rest,
        create: banner,
      });
    }
    console.log(`Banners ready: ${BANNERS.map((b) => b.id).join(", ")}`);
  } catch (error) {
    console.error("Failed to seed banners:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
