import { AxiosAdapter, AxiosRequestConfig, AxiosResponse } from "axios";

const MOCK_USER = {
  id: "mock-user-001",
  name: "Test User",
  email: "test@bexiemart.com",
  role: "customer",
  image: null,
  emailVerified: true,
  isActive: true,
  phoneNumber: "+233501234567",
  createdAt: new Date().toISOString(),
};

const MOCK_SESSION = {
  id: "mock-session-001",
  token: "mock-token-001",
  userId: "mock-user-001",
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  isActive: true,
};

const MOCK_CATEGORIES = [
  {
    id: "cat-1",
    name: "Fashion",
    slug: "fashion",
    image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=200",
  },
  {
    id: "cat-2",
    name: "Electronics",
    slug: "electronics",
    image: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=200",
  },
  {
    id: "cat-3",
    name: "Food & Groceries",
    slug: "food",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200",
  },
  {
    id: "cat-4",
    name: "Home & Living",
    slug: "home",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200",
  },
  {
    id: "cat-5",
    name: "Beauty",
    slug: "beauty",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200",
  },
  {
    id: "cat-6",
    name: "Sports",
    slug: "sports",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200",
  },
];

const MOCK_PRODUCTS = [
  {
    id: "p-1",
    name: "Classic White Sneakers",
    price: 250,
    originalPrice: 350,
    description: "Comfortable everyday sneakers",
    category: "Fashion",
    vendorId: "v-1",
    vendorName: "Jean Collections",
    stock: 15,
    rating: 4.5,
    reviewCount: 23,
    images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "p-2",
    name: "Wireless Bluetooth Earbuds",
    price: 180,
    description: "Noise-cancelling earbuds with 24hr battery",
    category: "Electronics",
    vendorId: "v-2",
    vendorName: "TechHub Ghana",
    stock: 30,
    rating: 4.2,
    reviewCount: 45,
    images: ["https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400"],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "p-3",
    name: "Organic Face Moisturizer",
    price: 95,
    description: "Natural hydrating face cream",
    category: "Beauty",
    vendorId: "v-3",
    vendorName: "Glow Store",
    stock: 20,
    rating: 4.8,
    reviewCount: 67,
    images: ["https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400"],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "p-4",
    name: "Premium Yoga Mat",
    price: 150,
    originalPrice: 200,
    description: "Non-slip exercise mat, 6mm thick",
    category: "Sports",
    vendorId: "v-4",
    vendorName: "FitLife GH",
    stock: 8,
    rating: 4.6,
    reviewCount: 12,
    images: ["https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400"],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "p-5",
    name: "Leather Crossbody Bag",
    price: 320,
    description: "Genuine leather, compact design",
    category: "Fashion",
    vendorId: "v-1",
    vendorName: "Jean Collections",
    stock: 5,
    rating: 4.9,
    reviewCount: 31,
    images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400"],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "p-6",
    name: "Stainless Steel Water Bottle",
    price: 65,
    description: "750ml insulated bottle",
    category: "Home & Living",
    vendorId: "v-5",
    vendorName: "Home essentials",
    stock: 40,
    rating: 4.3,
    reviewCount: 19,
    images: ["https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400"],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

const MOCK_BANNERS = [
  {
    id: "b-1",
    placement: "HOME",
    title: "Holiday Deals Are Live!",
    subtitle: "Up to 50% off",
    badge: "Limited Offer",
    imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800",
    ctaLabel: "Order Now",
    ctaRoute: "/(customer)/flash-sales",
    isActive: true,
    sortOrder: 0,
  },
  {
    id: "b-2",
    placement: "HOME",
    title: "Fresh Groceries",
    subtitle: "Delivered in 30 mins",
    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800",
    ctaLabel: "Shop Now",
    ctaRoute: "/(customer)/(shop)",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "b-3",
    placement: "FOOD",
    title: "Free Delivery",
    subtitle: "On your first 3 food orders!",
    imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
    ctaLabel: "Order Now",
    ctaRoute: "/(customer)/food",
    isActive: true,
    sortOrder: 0,
  },
];

const MOCK_FOOD_ITEMS = [
  {
    id: "f-1",
    name: "Jollof Rice & Chicken",
    price: 45,
    description: "Classic Ghanaian jollof with grilled chicken",
    vendorId: "v-6",
    vendorName: "Mama's Kitchen",
    stock: 20,
    rating: 4.7,
    images: ["https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400"],
    isAvailable: true,
  },
  {
    id: "f-2",
    name: "Grilled Tilapia",
    price: 65,
    description: "Fresh tilapia with spicy pepper sauce",
    vendorId: "v-6",
    vendorName: "Mama's Kitchen",
    stock: 10,
    rating: 4.5,
    images: ["https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400"],
    isAvailable: true,
  },
  {
    id: "f-3",
    name: "Kelewele & Plantain",
    price: 20,
    description: "Spicy fried plantain cubes",
    vendorId: "v-7",
    vendorName: "Street Bites",
    stock: 30,
    rating: 4.8,
    images: ["https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400"],
    isAvailable: true,
  },
];

const MOCK_WALLET = {
  id: "w-1",
  userId: "mock-user-001",
  balance: 1250.5,
  currency: "GHS",
  status: "active",
};

const MOCK_TRANSACTIONS = [
  {
    id: "t-1",
    type: "credit",
    amount: 500,
    description: "Wallet Top-up",
    status: "completed",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "t-2",
    type: "debit",
    amount: 45,
    description: "Order #ORD-001",
    status: "completed",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "t-3",
    type: "credit",
    amount: 100,
    description: "Referral Bonus",
    status: "completed",
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
];

const MOCK_ORDERS = [
  {
    id: "ORD-001",
    status: "delivered",
    total: 250,
    items: [{ name: "Classic White Sneakers", quantity: 1, price: 250 }],
    createdAt: new Date(Date.now() - 604800000).toISOString(),
  },
  {
    id: "ORD-002",
    status: "processing",
    total: 180,
    items: [{ name: "Wireless Bluetooth Earbuds", quantity: 1, price: 180 }],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const MOCK_SERVICES = [
  {
    id: "s-1",
    name: "Home Deep Cleaning",
    description: "Professional home cleaning service",
    price: 200,
    vendorId: "v-8",
    vendorName: "CleanPro GH",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400",
  },
  {
    id: "s-2",
    name: "Plumbing Repair",
    description: "Licensed plumber for all repairs",
    price: 150,
    vendorId: "v-9",
    vendorName: "FixIt Ghana",
    rating: 4.4,
    image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400",
  },
];

interface MockRouteHandler {
  matcher: RegExp;
  handler: (match: RegExpMatchArray) => any;
}

const ROUTES: MockRouteHandler[] = [
  // Auth
  { matcher: /\/auth\/getSession/, handler: () => ({ user: MOCK_USER, session: MOCK_SESSION }) },
  { matcher: /\/auth\/sign-in/, handler: () => ({ user: MOCK_USER, session: MOCK_SESSION }) },
  { matcher: /\/auth\/sign-up/, handler: () => ({ user: MOCK_USER, session: MOCK_SESSION }) },
  { matcher: /\/auth\/sign-out/, handler: () => ({}) },
  { matcher: /\/auth\/send-verification/, handler: () => ({}) },
  { matcher: /\/auth\/forgot-password/, handler: () => ({}) },
  { matcher: /\/auth\/reset-password/, handler: () => ({}) },
  { matcher: /\/auth\/check-availability/, handler: () => ({ available: true }) },

  // Products
  { matcher: /\/products\/categories/, handler: () => MOCK_CATEGORIES },
  { matcher: /\/products\/featured/, handler: () => MOCK_PRODUCTS.slice(0, 4) },
  {
    matcher: /\/products\/store\//,
    handler: () => ({
      vendor: { id: "v-1", name: "Jean Collections", rating: 4.8 },
      products: MOCK_PRODUCTS.filter((p) => p.vendorId === "v-1"),
    }),
  },
  {
    matcher: /\/products\/(\w+)/,
    handler: (m) => MOCK_PRODUCTS.find((p) => p.id === m[1]) || MOCK_PRODUCTS[0],
  },
  {
    matcher: /\/products/,
    handler: () => ({
      data: MOCK_PRODUCTS,
      meta: { total: MOCK_PRODUCTS.length, page: 1, totalPages: 1 },
    }),
  },

  // Banners
  { matcher: /\/banners\/active/, handler: () => MOCK_BANNERS },

  // Cart
  { matcher: /\/cart/, handler: () => ({ items: [], total: 0 }) },

  // Orders
  {
    matcher: /\/orders\/(\w+)/,
    handler: (m) => MOCK_ORDERS.find((o) => o.id === m[1]) || MOCK_ORDERS[0],
  },
  {
    matcher: /\/orders/,
    handler: () => ({
      data: MOCK_ORDERS,
      meta: { total: MOCK_ORDERS.length, page: 1, totalPages: 1 },
    }),
  },

  // Wallet
  {
    matcher: /\/wallet\/transactions/,
    handler: () => ({ data: MOCK_TRANSACTIONS, meta: { total: MOCK_TRANSACTIONS.length } }),
  },
  { matcher: /\/wallet\/cards/, handler: () => ({ data: [] }) },
  { matcher: /\/wallet\/bank-accounts/, handler: () => ({ data: [] }) },
  { matcher: /\/wallet\/momo-accounts/, handler: () => ({ data: [] }) },
  { matcher: /\/wallet/, handler: () => MOCK_WALLET },

  // Food
  {
    matcher: /\/food\/items/,
    handler: () => ({ data: MOCK_FOOD_ITEMS, meta: { total: MOCK_FOOD_ITEMS.length } }),
  },
  { matcher: /\/food/, handler: () => ({ data: MOCK_FOOD_ITEMS }) },

  // Services
  {
    matcher: /\/services/,
    handler: () => ({ data: MOCK_SERVICES, meta: { total: MOCK_SERVICES.length } }),
  },

  // Notifications
  { matcher: /\/notifications/, handler: () => ({ data: [], meta: { total: 0, unreadCount: 0 } }) },

  // Wishlist / Favorites
  { matcher: /\/wishlist/, handler: () => ({ data: [] }) },

  // Reviews
  { matcher: /\/reviews/, handler: () => ({ data: [], meta: { total: 0 } }) },

  // Addresses
  { matcher: /\/addresses/, handler: () => ({ data: [] }) },

  // Support
  { matcher: /\/support/, handler: () => ({ data: [], meta: { total: 0 } }) },

  // Referrals
  {
    matcher: /\/referrals/,
    handler: () => ({ code: "TEST123", referralCount: 0, totalEarnings: 0 }),
  },

  // Flash sales
  { matcher: /\/flash-sales/, handler: () => ({ data: [] }) },

  // Collections
  { matcher: /\/collections/, handler: () => ({ data: [] }) },

  // Reels
  { matcher: /\/reels/, handler: () => ({ data: [], meta: { total: 0 } }) },

  // User profile
  { matcher: /\/users\/me/, handler: () => MOCK_USER },
  { matcher: /\/users/, handler: () => MOCK_USER },

  // Chat
  { matcher: /\/chat\/conversations/, handler: () => ({ data: [] }) },
  { matcher: /\/chat/, handler: () => ({ data: [] }) },

  // Delivery
  { matcher: /\/delivery/, handler: () => ({ data: [] }) },

  // Vendor
  { matcher: /\/vendor/, handler: () => ({ data: null }) },

  // PostHog
  { matcher: /\/posthog/, handler: () => ({}) },

  // Health
  { matcher: /\/health/, handler: () => ({ status: "ok" }) },
];

function resolveMockData(url: string): any {
  for (const route of ROUTES) {
    const match = url.match(route.matcher);
    if (match) return route.handler(match);
  }
  // Default: return empty paginated response
  return { data: [], meta: { total: 0, page: 1, totalPages: 0 } };
}

export const mockAdapter: AxiosAdapter = (config: AxiosRequestConfig) => {
  return new Promise((resolve) => {
    setTimeout(
      () => {
        const url = config.url || "";
        const method = (config.method || "get").toLowerCase();
        const data = resolveMockData(url);

        const response: AxiosResponse = {
          data,
          status: 200,
          statusText: "OK",
          headers: {},
          config: config as any,
        };

        // Simulate slight network delay for realistic loading states
        resolve(response);
      },
      150 + Math.random() * 200
    );
  });
};
