# BexieMart — Product Requirements Document
## React Native Frontend Rebuild

**Version:** 1.0  
**Date:** April 27, 2026  
**Status:** Draft  
**Timeline:** 4 weeks (4 developers)  
**Author:** Devy (from existing Flutter + NestJS codebase analysis)

---

## 1. Executive Summary

BexieMart is a **campus marketplace** mobile application. The existing Flutter frontend is being rebuilt in **React Native** and connected to the existing NestJS/Prisma backend. Timeline is aggressive: **4–5 weeks to a shippable v1**.

**Tagline:** "Shop Smart, Live Easy — Your Campus Marketplace"

**Platforms:** iOS + Android (mobile-first)

**Critical constraint:** The Flutter app currently uses 100% mock data with simulated auth. This rebuild must replace all mock data with live API calls from day one.

---

## 2. Product Goals

| # | Goal | Success Metric |
|---|------|---------------|
| G1 | Rebuild core customer + vendor flows in React Native | ~20 key screens functional, connected to API |
| G2 | Real JWT authentication against backend | Login, register, token refresh all working |
| G3 | End-to-end purchase flow | Browse → Cart → Checkout → Paystack payment → Order confirmed |
| G4 | Vendor product/order management | CRUD products, manage orders, view earnings |
| G5 | Maintain visual parity with Flutter design | Colors, fonts, spacing, component styles match |
| G6 | Ship within 4 weeks (4 developers) | Build submitted to App Store Connect + Play Console |

---

## 3. v1 Scope — What's In, What's Out

### ✅ IN (v1)

**Auth:** Launch, Login, Register, Forgot Password, JWT management

**Customer:**
- Home: Search, categories grid, top products, ad carousel
- Shop tab: Product grid, basic category filter
- Product Details: Images, info, seller, add to cart, add to wishlist
- Cart: Items list, quantity, price summary, checkout
- Checkout/Payment: Address, delivery option, Paystack payment
- Favorites/Wishlist: Grid view, remove
- All Products view (category/section drill-down)

**Vendor:**
- Dashboard: Stats cards, recent orders
- Products: List, add, edit, delete, image upload (Cloudinary)
- Orders: List with status badges, order details, status update
- Earnings: Overview, transaction history, withdrawal
- Settings: Shop profile, logout

### ❌ OUT (v1)

- Earn tab, Wallet tab (separate tabs — basic wallet balance visible in checkout)
- Onboarding screens after first login
- Recently Viewed
- Coupon management for vendors (customer coupon input stays in checkout)
- Push notifications (in-app notification list stays)
- Rider features (separate app)
- Charts (vendor dashboard: stats cards only, no graphs)
- Referral system
- Phone verification flow

### 🎯 Stretch Goals (if ahead of schedule)

- **Food tab** — simplified product grid filtered to food category + delivery time indicator
- **Basic Wallet tab** — balance display + transaction history (API already exists)

---

## 4. User Roles

| Role | Description |
|------|-------------|
| **Customer** | Browses, searches, buys products. Favorites items, manages cart, places orders. |
| **Vendor** | Lists products, manages inventory, processes orders, withdraws earnings. |
| **Admin** | Web dashboard only. Not in mobile scope. |

---

## 5. Functional Requirements (v1 Only)

### 5.1 Authentication

| ID | Feature | Notes |
|----|---------|-------|
| A1 | Launch Screen | Logo + "Get Started" / "I already have an account" |
| A2 | Register | Email, name, phone, password. Role selection (customer/vendor). |
| A3 | Login | Email + password. Redirect based on role → customer tabs or vendor tabs. |
| A4 | Forgot Password | Email → token → new password. 3-step flow. |
| A5 | JWT Management | Secure storage, auto-refresh on 401, logout on expiry. |

### 5.2 Customer — Home Tab

| ID | Feature | Notes |
|----|---------|-------|
| C1 | Search Bar | Real-time search across product names + categories. Results dropdown with tap-to-navigate. |
| C2 | Ad Carousel | Auto-scrolling promo banners. From API or hardcoded for v1. |
| C3 | Category Grid | Horizontal-scrolling cards. 2×2 product thumbnail grid per category. "See All" → full category view. |
| C4 | Top Products | Horizontal list (highest rated). "See All" → filtered view. |
| C5 | Favorites + Cart icons | AppBar buttons with badge counts. |

### 5.3 Customer — Shop Tab

| ID | Feature | Notes |
|----|---------|-------|
| S1 | Product Grid | Paginated product grid. Pull-to-refresh. |
| S2 | Category Filter | Pills/chips for category filtering. |
| S3 | Product Card | Image, name, price, rating, discount badge, favorite toggle. |

### 5.4 Customer — Product Details

| ID | Feature | Notes |
|----|---------|-------|
| PD1 | Image Gallery | Swipeable image carousel. |
| PD2 | Product Info | Name, price, discount, description, color, stock status. |
| PD3 | Seller Info | Shop name, logo. |
| PD4 | Ratings & Reviews | Star rating + review list. |
| PD5 | Delivery Options | Display available delivery types/fees/times. |
| PD6 | Add to Cart | Quantity selector + CTA button. |
| PD7 | Wishlist Toggle | Heart icon add/remove. |

### 5.5 Customer — Cart

| ID | Feature | Notes |
|----|---------|-------|
| CT1 | Cart Items | Product image, name, price, quantity +/-, remove. |
| CT2 | Price Summary | Subtotal, delivery fee, discount, total. |
| CT3 | Coupon Input | Apply code, validate via API, show discount. |
| CT4 | Checkout CTA | Navigate to payment flow. |
| CT5 | Empty State | Illustration + "Browse Products" button. |

### 5.6 Customer — Checkout / Payment

| ID | Feature | Notes |
|----|---------|-------|
| PY1 | Delivery Address | Address input + phone number. |
| PY2 | Delivery Option | Select from available methods. |
| PY3 | Payment Method | Card or Mobile Money. |
| PY4 | Paystack Integration | Initialize transaction → handle callback → verify. |
| PY5 | Processing Screen | Loading animation during payment. |
| PY6 | Success / Failure | Order confirmed (with details) or error with retry. |

### 5.7 Customer — Favorites

| ID | Feature | Notes |
|----|---------|-------|
| WL1 | Wishlist Grid | Favorited products. Tap → details. Swipe/button to remove. |
| WL2 | Empty State | Illustration + CTA. |

### 5.8 Customer — All Products (Section View)

| ID | Feature | Notes |
|----|---------|-------|
| AP1 | Dynamic Header | Title from context (category name, "Top Products", etc.). Back button. |
| AP2 | Product Grid | Full scrollable grid of filtered products. |

### 5.9 Notifications (In-App)

| ID | Feature | Notes |
|----|---------|-------|
| N1 | Notification List | Chronological. Read/unread styling. |

### 5.10 Vendor — Dashboard Tab

| ID | Feature | Notes |
|----|---------|-------|
| V1 | Stats Cards | Total products, total orders, total earnings, pending orders. |
| V2 | Recent Orders | Last 5 orders with status. Tap → details. |

### 5.11 Vendor — Products Tab

| ID | Feature | Notes |
|----|---------|-------|
| VP1 | Product List | Scrollable list with image, name, price, stock, status. |
| VP2 | Add Product | Form: name, description, category, price, discount, quantity, color, images (multi-upload → Cloudinary), delivery options. |
| VP3 | Edit Product | Pre-filled form from existing product data. |
| VP4 | Delete Product | Confirm dialog → API call. |
| VP5 | Image Upload | Camera/gallery picker. Cloudinary upload with progress. |

### 5.12 Vendor — Orders Tab

| ID | Feature | Notes |
|----|---------|-------|
| VO1 | Orders List | All orders. Filterable by status (tabs/pills). |
| VO2 | Status Badges | Color-coded: pending, confirmed, processing, shipped, delivered, cancelled. |
| VO3 | Order Details | Items, quantities, prices, address, customer contact, payment status. |
| VO4 | Status Update | Dropdown/buttons to advance order status. |

### 5.13 Vendor — Earnings Tab

| ID | Feature | Notes |
|----|---------|-------|
| VE1 | Earnings Cards | Total earned, pending commission, withdrawn. |
| VE2 | Transaction History | List of credits with dates, amounts, order refs. |
| VE3 | Withdraw | Initiate withdrawal to bank/mobile money. |

### 5.14 Vendor — Settings Tab

| ID | Feature | Notes |
|----|---------|-------|
| VS1 | Shop Profile | Edit name, description, logo, location, contact, delivery range. |
| VS2 | Logout | Clear tokens, navigate to launch. |

---

## 6. Non-Functional Requirements

| Category | Requirement |
|----------|------------|
| **Performance** | Cold start <2s. Screen transitions <300ms. Virtualized lists. Image caching + placeholders. |
| **Security** | JWT in secure storage. HTTPS only. No sensitive data in AsyncStorage. |
| **Errors** | Human-readable messages. Retry buttons. Never show raw stack traces. |
| **Offline** | Graceful degradation. Cached data shown when available. Clear "no connection" indicators. |
| **Platform** | iOS 15+ / Android 8+. Safe area handling. |
| **Accessibility** | 44×44pt minimum touch targets. Screen reader labels. |

---

## 7. Technical Architecture

### 7.1 Stack (Decided — No Debate)

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | React Native with **Expo (managed)** | Fastest setup. OTA updates. Works with Paystack WebView. |
| **Language** | TypeScript (strict) | Matches NestJS backend. No `any` without justification. |
| **Navigation** | React Navigation 7 | Native stack + bottom tabs. Closest to Flutter's go_router. |
| **Server State** | TanStack Query (React Query) v5 | Caching, retry, stale-while-revalidate. All API data goes through this. |
| **Client State** | Zustand | Auth tokens, cart, UI state. Minimal. Lightweight. |
| **HTTP** | Axios + interceptors | Token injection, 401 refresh, base URL config. |
| **Forms** | React Hook Form + Zod | Matches backend class-validator DTOs. |
| **Styling** | StyleSheet (no Tailwind) | Avoids NativeWind build issues. Direct, predictable. |
| **Images** | expo-image | Caching, blurhash placeholders, Cloudinary transforms. |
| **Payments** | Paystack via WebView | Most reliable cross-platform. SDK alternatives are unstable on Expo. |
| **Secure Storage** | expo-secure-store | JWT tokens. |

### 7.2 Project Structure

```
src/
├── navigation/
│   ├── RootNavigator.tsx       # Auth check → Auth or Main
│   ├── AuthNavigator.tsx       # Stack: Launch, Login, Register, ForgotPassword
│   ├── CustomerTabs.tsx        # Bottom tabs: Home, Shop, 3rd placeholder, 4th placeholder, 5th placeholder
│   └── VendorTabs.tsx          # Bottom tabs: Dashboard, Products, Orders, Earnings, Settings
├── screens/
│   ├── auth/
│   │   ├── LaunchScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   └── ForgotPasswordScreen.tsx
│   ├── customer/
│   │   ├── HomeScreen.tsx
│   │   ├── ShopScreen.tsx
│   │   ├── ProductDetailsScreen.tsx
│   │   ├── AllProductsScreen.tsx
│   │   ├── CartScreen.tsx
│   │   ├── CheckoutScreen.tsx
│   │   ├── PaymentScreen.tsx (WebView wrapper)
│   │   └── FavoritesScreen.tsx
│   ├── vendor/
│   │   ├── DashboardScreen.tsx
│   │   ├── ProductsScreen.tsx
│   │   ├── AddEditProductScreen.tsx
│   │   ├── OrdersScreen.tsx
│   │   ├── OrderDetailsScreen.tsx
│   │   ├── EarningsScreen.tsx
│   │   └── SettingsScreen.tsx
│   └── shared/
│       └── NotificationsScreen.tsx
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── FormInput.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── EmptyState.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── Carousel.tsx
│   ├── product/
│   │   ├── ProductCard.tsx
│   │   └── ProductGrid.tsx
│   ├── cart/
│   │   ├── CartItem.tsx
│   │   └── CartSummary.tsx
│   └── vendor/
│       ├── StatsCard.tsx
│       └── OrderStatusBadge.tsx
├── api/
│   ├── client.ts              # Axios instance + interceptors
│   ├── auth.ts
│   ├── products.ts
│   ├── cart.ts
│   ├── orders.ts
│   ├── payments.ts
│   └── vendor.ts
├── hooks/
│   ├── useAuth.ts             # TanStack Query: login, register, me
│   ├── useProducts.ts         # TanStack Query: list, detail, categories
│   ├── useCart.ts             # TanStack Query: get, add, update, remove
│   └── useOrders.ts           # TanStack Query: create, list, detail
├── stores/
│   ├── authStore.ts           # Zustand: user object, tokens, role, isAuthenticated
│   └── cartStore.ts           # Zustand: local cart state, synced to API
├── theme/
│   ├── colors.ts
│   ├── typography.ts
│   └── spacing.ts
├── types/
│   └── index.ts               # All TypeScript types/interfaces
└── utils/
    ├── storage.ts             # expo-secure-store wrappers
    ├── format.ts              # Currency (GHS), dates
    └── constants.ts           # API base URL, app config
```

### 7.3 API Integration Map

All endpoints from the NestJS backend. Files in `src/api/`:

| API Module | Key Endpoints |
|-----------|---------------|
| `auth.ts` | POST `/auth/login`, POST `/auth/register`, POST `/auth/forgot-password`, POST `/auth/reset-password`, GET `/auth/me` |
| `products.ts` | GET `/products`, GET `/products/:id`, GET `/products/categories` |
| `cart.ts` | GET `/cart`, POST `/cart`, PUT `/cart/:id`, DELETE `/cart/:id` |
| `orders.ts` | POST `/orders`, GET `/orders`, GET `/orders/:id`, PATCH `/orders/:id/status` |
| `payments.ts` | POST `/payments/initialize`, GET `/payments/verify/:reference` |
| `vendor.ts` | GET/POST/PUT/DELETE vendor products, GET vendor orders, GET vendor earnings |
| `wishlist.ts` | GET `/wishlist`, POST `/wishlist`, DELETE `/wishlist/:id` |
| `notifications.ts` | GET `/notifications`, PATCH `/notifications/:id/read` |

---

## 8. Design System

### 8.1 Colors

```
primary:       #004CFF
secondary:     #ADD8E6
textPrimary:   #111322
textSecondary: #5F6C7B
background:    #FFFFFF
surface:       #F5F5F5
error:         #B3261E
warning:       #F59E0B
success:       #08A81D
border:        #E4E7EC
```

### 8.2 Typography

| Role | Family | Weights | Sizes |
|------|--------|---------|-------|
| Headings | Raleway | 600, 700 | 18, 20, 22, 24, 32 |
| Body | Nunito | 300, 400, 500, 600 | 11, 12, 14, 16 |

Load via `expo-font`. Use the exact `.ttf` files from the Flutter `assets/fonts/` directory.

### 8.3 Spacing Scale

`4, 8, 12, 16, 20, 24, 32, 64`

### 8.4 Reusable Components (Build Once, Use Everywhere)

| Component | Props | Used In |
|-----------|-------|---------|
| `Button` | title, onPress, loading, variant (primary/outline/danger), disabled | Every screen |
| `FormInput` | label, placeholder, error, secureTextEntry, suffixIcon, keyboardType | Auth, product forms, checkout |
| `ProductCard` | product, onPress, onFavorite | Home, Shop, Favorites, AllProducts |
| `EmptyState` | image, title, subtitle, actionLabel, onAction | Cart, Favorites, Orders |
| `Badge` | count, color | Cart icon, notification icon |
| `Carousel` | items, autoPlay | Home ads, product images |
| `StatsCard` | title, value, icon, color | Vendor dashboard |
| `OrderStatusBadge` | status | Vendor orders list |

---

## 9. Implementation Plan (4 Weeks — 4 Developers)

### Week 1 — Foundation + Auth

| Day | Dev A — Infrastructure | Dev B — Auth Screens | Dev C — Components | Dev D — Prep + Scaffold |
|-----|------------------------|----------------------|--------------------|--------------------------|
| 1 | Expo init, deps, folder structure, path aliases, theme files, types | Set up dev environment, review Flutter screenshots | Set up dev environment, review Flutter components | Set up dev environment, study backend API docs |
| 2 | Axios client + interceptors, auth API module, secure storage utils | Launch screen UI | Button, FormInput, LoadingSpinner components | Study Prisma schema, map API response shapes to TS types |
| 3 | Auth store (Zustand), navigation skeleton (Root, Auth stack, Customer tabs, Vendor tabs) | Login screen + hook up to API | EmptyState, Badge, Card components | Scaffold customer tab navigator, ProductCard component |
| 4 | Token refresh logic, auth flow testing | Register screen + hook up to API | Carousel component | Scaffold vendor tab navigator, StatsCard component |
| 5 | Forgot password API + navigation wiring | Forgot password UI (3-step flow) | FormInput polish (error states, visibility toggle) | ProductGrid component, start Home screen scaffolding |
| 6 | Customer + Vendor route guards (redirect based on role) | Auth screens polish + testing | Component library review + documentation | Wire category API, start Shop screen scaffolding |
| 7 | **Buffer day** — integration fixes, PR reviews | Test full auth flow end-to-end | UI component audit (accessibility, touch targets) | Test API connectivity from screens |

**Week 1 Milestone:** Register, login, role-based routing, JWT persistence. Component library built. Navigation skeleton complete.

---

### Week 2 — Customer Experience

| Day | Dev A — Search + Categories | Dev B — Product Details | Dev C — Cart | Dev D — Vendor Products |
|-----|---------------------------|------------------------|-------------|------------------------|
| 1 | Search API + search bar component with results dropdown | Product details screen (image gallery, product info) | Cart screen UI (CartItem, CartSummary) | Vendor products list screen (from API) |
| 2 | Category grid (horizontal scroll, 2×2 thumbs) | Seller info section + ratings/reviews display | Cart API hooks (get, add, update, remove) | Add product form (step 1: basic fields) |
| 3 | Top products section + "See All" navigation | Add to cart + wishlist toggle (API connected) | Quantity adjustment + remove item | Add product form (step 2: images + delivery options) |
| 4 | Ad carousel (hardcoded data) | Delivery options section | Coupon input + validation | Image upload → Cloudinary (expo-image-picker + progress) |
| 5 | Home screen assembly (all sections together) | Related products (same category) | Cart badge on tab bar (Zustand) | Edit product (pre-filled form) |
| 6 | All Products screen (dynamic section view) | Favorites screen (wishlist API) | Empty cart state | Delete product (confirm dialog + API) |
| 7 | **Buffer day** — Home screen performance, list virtualization | Cross-screen navigation testing | Cart sync testing (add from details → appears in cart) | Product CRUD end-to-end testing |

**Week 2 Milestone:** Full customer browsing experience works. Vendor can manage product catalog.

---

### Week 3 — Checkout + Vendor Management

| Day | Dev A — Checkout | Dev B — Orders + Earnings | Dev C — Payments | Dev D — Vendor Dashboard + Orders |
|-----|-----------------|--------------------------|------------------|----------------------------------|
| 1 | Checkout screen (address, delivery option selection) | Vendor orders list (from API, with status filter) | Paystack WebView integration (initialize transaction) | Vendor dashboard (stats cards from API) |
| 2 | Order summary + price breakdown | Order status badges component | Payment processing screen (loading animation) | Recent orders on dashboard |
| 3 | Create order API hook | Order details screen | Payment success screen (order confirmation) | Orders list interaction (tap → details, filter tabs) |
| 4 | Checkout flow wiring (cart → checkout → payment) | Order status update (vendor actions) | Payment failure + retry flow | Order details: items, customer info, payment status |
| 5 | Checkout validation (Zod schemas) | Vendor earnings overview + history | Payment WebView edge cases (back button, timeout) | Order status update functionality |
| 6 | End-to-end purchase flow testing | Withdrawal flow (bank/momo selection) | Payment flow testing with Paystack test keys | Vendor orders testing (full lifecycle) |
| 7 | **Buffer day** — checkout edge cases, loading states | Earnings flow testing | Payment error handling sweep | Integration testing (vendor + customer flows interact) |

**Week 3 Milestone:** Complete purchase flow works. Money moves (in test mode). Vendor can process orders and view earnings.

---

### Week 4 — Polish + Ship

| Day | Dev A | Dev B | Dev C | Dev D |
|-----|-------|-------|-------|-------|
| 1 | Settings screens (shop profile, logout) | Notifications screen | Error handling sweep | Empty states sweep |
| 2 | Loading states audit (every screen) | Form validation sweep (Zod on all forms) | Pull-to-refresh everywhere | Keyboard handling (KeyboardAvoidingView) |
| 3 | Safe area audit (notch, home indicator) | Accessibility pass (labels, contrast) | Image optimization (Cloudinary URL transforms) | **Stretch:** Food tab or Wallet tab |
| 4 | App icon + splash screen | Build and test on real iOS device | Build and test on real Android device | **Stretch:** Food tab or Wallet tab |
| 5 | Bug fixes from device testing | App Store metadata + screenshots | Play Store metadata + screenshots | Bug fixes + final PR reviews |
| 6 | **FINAL BUILD** — iOS (TestFlight) | Regression testing | **FINAL BUILD** — Android (Internal Testing) | Regression testing |
| 7 | **SHIP** — Submit to App Store Connect | **SHIP** — Submit to Google Play Console | Post-submission monitoring | Documentation + handoff notes |

**Week 4 Milestone:** Both builds submitted. App in review.

---

## 10. Team Work Strategy (4 Developers)

### Ownership Map

| Dev | Primary Domain | Screens Owned | Key Deliverables |
|-----|---------------|---------------|------------------|
| **Dev A — Infrastructure** | Navigation, API layer, state management, theme, types | Auth (Launch, Login, Register, ForgotPassword), Checkout, Settings | `api/client.ts`, `stores/`, `navigation/`, `theme/`, `types/` |
| **Dev B — Customer Browse** | Product discovery, search, details | Home, Shop, ProductDetails, AllProducts, Favorites | Search, categories, product cards, wishlist |
| **Dev C — Cart & Payments** | Purchase flow, Paystack | Cart, PaymentScreen, Success/Failure | Cart state, checkout validation, payment integration |
| **Dev D — Vendor** | Seller experience | Dashboard, Products (CRUD), Orders, Earnings | Product forms, image upload, order management, withdrawal |

### Shared Responsibilities

| Area | Who Contributes | When |
|------|----------------|------|
| **Component library** (`components/ui/`) | All 4 — Dev A leads | Week 1 (build), ongoing (add as needed) |
| **API modules** (`api/*.ts`) | Each dev creates their domain's API file | As features are built |
| **Types** (`types/index.ts`) | All 4 — Dev A reviews/merges | Week 1 (base), ongoing |
| **Code review** | All 4 — at least 1 approval per PR | Continuous |
| **Device testing** | All 4 — each dev tests on both platforms | Week 4 |

### Critical Path

```
Week 1: Dev A (infrastructure) → unblocks everyone
Week 2: Devs B, C, D run in parallel on screens
Week 3: Devs A, C (checkout/payment) is the critical path
Week 4: All four on polish + ship
```

### Communication Rules

1. **Daily standup** — 10 min. What you shipped yesterday, what you're shipping today, blockers.
2. **API module spec first** — before writing a screen, define the API response TypeScript interface. Share it.
3. **Component before screen** — don't build a screen with inline styles. Build or use shared components.
4. **PR size limit** — if a PR touches more than 5 files or 300 lines, split it.
5. **No mock data** — even during development, use the real API (point at staging). If the endpoint doesn't exist yet, flag it immediately.

---

## 11. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Dev A becomes bottleneck (infrastructure) | High | Dev A focuses ONLY on infrastructure Week 1. Other devs prep in parallel. Infrastructure must be feature-complete by Day 4. |
| Paystack WebView issues on real devices | Medium | Test on real device by Week 3 Day 1. Fall back to redirect URL approach if WebView fails. |
| Cloudinary upload failures on slow networks | Low | Expo Image Picker is reliable. Add retry + progress bar. Compress images before upload. |
| Backend API gaps discovered mid-sprint | Medium | Each dev audits their API endpoints against backend by Week 1 Day 2. Flag missing endpoints immediately. |
| Design drift from Flutter original | Low | Screenshot every Flutter screen into a shared reference folder. Review side-by-side during PR. |
| Merge conflicts on shared files | Medium | Clear ownership documented. `components/ui/` changes require Dev A approval. Small, frequent PRs. |
| Team unfamiliar with TanStack Query | Low | 1-hour team workshop on Day 1. Pattern is simple: `useQuery` for reads, `useMutation` for writes. |

---

## 12. Handoff Checklist

Before declaring v1 done:

- [ ] All P0 features tested on real iOS + Android devices
- [ ] Payment flow tested in Paystack test mode
- [ ] Token refresh works (wait 15 min, verify 401 → refresh → retry)
- [ ] App works in airplane mode (graceful offline states)
- [ ] No hardcoded strings — all user-facing text is extractable
- [ ] App icon and splash screen set
- [ ] Builds pass for both platforms with no warnings

---

_Generated from analysis of Flutter frontend and NestJS backend codebases. April 27, 2026._
