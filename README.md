# BexieMart 🛍️🇬🇭

**BexieMart** is a next-generation, multi-vendor campus e-commerce, food delivery, and social commerce ecosystem built specifically for university campuses across Ghana (e.g., KNUST, University of Ghana, UCC). 

Connecting student entrepreneurs, local campus vendors, delivery riders, and thousands of campus consumers into a unified digital marketplace, BexieMart streamlines commerce with localized mobile money (MoMo) payments, real-time delivery logistics, and engaging shoppable video content.

---

## 🌟 Key Features

### 🛒 For Campus Customers
- **Unified Marketplace & Food Court**: Browse physical merchandise (fashion, electronics, textbooks, services) alongside instant hot food delivery from campus cafeterias and restaurants.
- **Shoppable Video Reels**: Discover products and vendor spotlights through vertical video feeds (9:16) with instant one-click "Tag to Buy" overlays.
- **Integrated Campus Wallet & Paystack MoMo**: Seamless mobile money deposits (MTN MoMo, Telecel, AirtelTigo) and card payments powered by Paystack, with instant checkout and PIN-protected wallet balances.
- **Real-Time Order & Delivery Tracking**: Live WebSocket tracking for order preparation and rider GPS updates from pickup to dormitory drop-off.
- **In-App Messaging & Support**: Direct real-time chat with vendors and assigned delivery riders.
- **Loyalty & Referrals**: Earn rewards, coupon discounts, and referral bonuses on campus purchases.

### 🏪 For Student Vendors & Merchants
- **Comprehensive Vendor Dashboard**: Manage inventory, product variations, service offerings, and restaurant food menus from your smartphone.
- **Shoppable Reel Studio**: Upload, trim, and publish high-engagement video showcases directly linked to store inventory.
- **Order Management & Fulfillment**: Accept, reject, or assign orders with real-time status updates and delivery handoffs.
- **Financial Analytics & Payouts**: Real-time sales insights, revenue breakdowns, and automated mobile money withdrawal requests.
- **Store Customization**: Configure business operating hours, custom coupons, and store verification documents.

### 🛵 For Delivery Riders
- **Instant Dispatch & Routing**: Live delivery dispatch system tailored to campus dormitories, lecture halls, and landmarks.
- **Earnings & Wallet Tracking**: Track per-delivery earnings and request instant payouts to mobile money wallets.

### 🛡️ For Platform Admins (`/apps/admin`)
- **System Governance**: Full oversight of users, vendor verification approvals, dispute resolution, and store moderations.
- **Financial Oversight**: Monitor platform volume, Paystack fee commissions, and payout processing via interactive dashboards.

---

## 🏗️ Monorepo Architecture & Tech Stack

BexieMart is structured as a modern full-stack TypeScript monorepo designed for scale, type safety, and developer velocity.

| Layer | Application / Package | Key Technologies |
| :--- | :--- | :--- |
| **Mobile App** | `apps/mobile` | **React Native** (Expo SDK 52+), **NativeWind** (Tailwind CSS v4), **Zustand**, **TanStack React Query**, **Expo Router v4**, **Better Auth Expo** |
| **Backend API** | `apps/server` | **NestJS 10**, **Prisma ORM**, **PostgreSQL**, **Better Auth**, **Socket.IO** (WebSockets), **Paystack Engine**, **Cloudinary** |
| **Admin Portal** | `apps/admin` | **Next.js 16** (App Router), **React 19**, **Tailwind CSS**, **TanStack Table**, **Recharts**, **Lucide Icons** |
| **Shared Core** | `packages/shared` | **Zod v3/v4** end-to-end validation schemas, shared utility types |

---

## 📐 Architectural Highlights

### 1. Decoupled Cart Architecture (`Main Cart` vs. `Food Cart`)
To solve the friction between standard e-commerce logistics and instant restaurant prep, BexieMart implements strict domain separation between general retail items and hot food:
- **`Cart` (Retail & Physical Goods)**: Supports multi-vendor basket building, flexible shipping schedules, and batch processing across campus store listings.
- **`FoodCart` (Instant Dining & Cafeterias)**: Isolated to single-restaurant ordering per checkout session to ensure immediate kitchen ticket generation, precise preparation timing, and dedicated rapid rider dispatch without blocking merchandise orders.

### 2. Multi-Role Authentication & Security (`Better Auth`)
Authentication is powered by **Better Auth** using a unified identity layer that supports multi-role access control (`CUSTOMER`, `VENDOR`, `RIDER`, `ADMIN`), secure session token rotation, native device storage adapters (`SecureStore`), and rate-limited endpoints.

### 3. Real-Time WebSocket Engine (`Socket.IO`)
Live interactions use a bi-directional event bus managed by NestJS gateways (`/apps/server/src/gateways`) to orchestrate order status transitions, live messaging between customer/vendor/rider rooms, and instant notification broadcasts.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.x or higher (`v20+` recommended)
- **Package Manager**: `npm` v10+
- **Database**: PostgreSQL 15+ (Local instance or Cloud provider like Neon / Supabase / Railway)
- **Mobile Environment**: [Expo Go](https://expo.dev/) app installed on iOS/Android, plus Android Studio / Xcode for native simulator builds.
- **External Services**: Accounts on [Paystack](https://paystack.com/) (for payment gateway keys) and [Cloudinary](https://cloudinary.com/) (for media processing).

---

### Step 1: Clone & Install Dependencies
```bash
git clone https://github.com/Aeomar999/Bexiemart.git
cd Bexiemart

# Install dependencies across all workspaces
npm install
```

---

### Step 2: Backend Setup (`/apps/server`)

1. Navigate to the server directory and create your environment file:
   ```bash
   cd apps/server
   cp .env.example .env  # or create manually if .env.example is not present
   ```

2. Configure `apps/server/.env` with your service credentials:
   ```env
   # Database Configuration
   DATABASE_URL="postgresql://postgres:password@localhost:5432/bexiemart?schema=public"

   # Better Auth Security
   BETTER_AUTH_SECRET="replace-with-a-64-character-hex-secret"
   BETTER_AUTH_URL="http://localhost:3000"

   # Server Settings
   PORT=3000
   NODE_ENV="development"

   # Paystack Payment Gateway (Ghana MoMo & Cards)
   PAYSTACK_SECRET_KEY="sk_test_..."
   PAYSTACK_PUBLIC_KEY="pk_test_..."

   # Cloudinary Media Storage (Product images & Shoppable Reels)
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"
   ```

3. Initialize the database and generate Prisma clients:
   ```bash
   # Generate Prisma client artifacts
   npx prisma generate

   # Run database migrations to provision tables
   npx prisma migrate dev --name init

   # Start the NestJS backend in development watch mode
   npm run start:dev
   ```
   > ✅ **Swagger API Explorer**: Once running, open **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)** to interactively test all API endpoints.

---

### Step 3: Mobile App Setup (`/apps/mobile`)

1. Navigate to the mobile directory and configure environment variables:
   ```bash
   cd ../mobile
   ```

2. Create `apps/mobile/.env` (Note: Physical mobile devices cannot access `localhost` directly; use your machine's local Wi-Fi IPv4 address):
   ```env
   # Use your local machine IPv4 (e.g. 192.168.1.150) or your tunnel domain
   EXPO_PUBLIC_API_URL="http://192.168.x.x:3000/api"

   # Paystack Public Key
   EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_..."
   ```

3. Launch the development server:
   ```bash
   # Start Expo Metro bundler
   npm run start

   # Or launch directly on target platforms:
   npm run android  # Android Emulator
   npm run ios      # iOS Simulator (macOS only)
   ```
   > 📱 Scan the generated QR code with **Expo Go** on your physical phone (ensure both computer and phone are connected to the exact same Wi-Fi network).

---

### Step 4: Admin Portal Setup (`/apps/admin`)

1. Navigate to the admin web application:
   ```bash
   cd ../admin
   ```

2. Create `apps/admin/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:3000/api"
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   > 🖥️ Access the platform governance dashboard at **[http://localhost:3001](http://localhost:3001)**.

---

## 💳 Paystack & Local Webhooks Configuration

To simulate mobile money deposits, order checkouts, and automated vendor payouts during local development, Paystack must be able to deliver HTTP webhook notifications to your running NestJS server (`apps/server`).

1. **Expose Local Server via Tunneling (e.g., ngrok)**:
   ```bash
   ngrok http 3000
   ```
2. **Configure Paystack Dashboard**:
   - Go to **Paystack Dashboard** → **Settings** → **API Keys & Webhooks**.
   - Under **Test Webhook URL**, enter your secure forwarding URL:
     `https://<your-ngrok-id>.ngrok-free.app/api/v1/webhooks/paystack`
3. **Verify Events**: Top-ups (`charge.success`), transfer completions (`transfer.success`), and refund notifications will now automatically trigger wallet balance updates across the mobile app.

---

## 🧪 Testing & Verification

The repository maintains automated test suites across frontend and backend modules:

```bash
# Run unit tests across mobile app (120+ suites)
cd apps/mobile
npm test

# Run unit and end-to-end (e2e) tests for NestJS backend
cd apps/server
npm run test
npm run test:e2e

# Run lint checks across projects
npm run lint --workspaces
```

---

## 📚 Documentation & Reference Guides

Additional deep-dive manuals and design documentation can be found in the `/docs` directory:
- `docs/RELEASE-SECRETS.md` - Required production secrets, EAS environment variables, and TLS setup.
- `docs/bexiemart-paystack-setup-manual.md` - Complete Paystack regulatory and technical integration handbook.
- `docs/bexiemart-wallet-integration_PRD.md` - Product requirements and state machine for campus wallet ledger.
- `docs/DESIGN-SYSTEM.md` - UI/UX tokens, typography, and component guidelines.
- `docs/architecture-map_1.md` - System diagrams and database entity relationships.

---

## 📄 License
This project is proprietary and confidential to **BexieMart Ghana**. All rights reserved.