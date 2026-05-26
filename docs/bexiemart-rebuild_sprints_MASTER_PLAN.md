# Sprint Master Plan — BexieMart React Native Rebuild

**Timeline:** 4 weeks | **Team:** 4 developers | **Generated:** April 27, 2026

---

## Quick Reference — Who Owns What

| Dev | Role | Sprint File | Top Priority Week 1 |
|-----|------|-------------|---------------------|
| **Dev A** | Infrastructure & Auth Lead | [`DEV-A_INFRASTRUCTURE.md`](./DEV-A_INFRASTRUCTURE.md) | API client, navigation, auth store, theme, types — **blocks everyone** |
| **Dev B** | Customer Browse Lead | [`DEV-B_CUSTOMER_BROWSE.md`](./DEV-B_CUSTOMER_BROWSE.md) | Auth screens (Launch, Login, Register, ForgotPassword) |
| **Dev C** | Cart & Payments Lead | [`DEV-C_CART_PAYMENTS.md`](./DEV-C_CART_PAYMENTS.md) | Shared UI components (Button, FormInput, etc.) — **blocks everyone** |
| **Dev D** | Vendor Experience Lead | [`DEV-D_VENDOR.md`](./DEV-D_VENDOR.md) | Navigation scaffold, ProductCard, StatsCard, vendor API module |

---

## Week-by-Week Ownership Map

```
WEEK 1 — FOUNDATION
┌─────────────────────────────────────────────────────────┐
│ Dev A: ═══api/client═══ ═══navigation═══ ═══auth═══    │ ← CRITICAL PATH
│ Dev B: ═══research═══ ══Launch══ ══Login══ ══Register══│
│ Dev C: ═══Button══ ══FormInput══ ══EmptyState══ ═══Badge═══│ ← COMPONENTS
│ Dev D: ═══types══ ══navigation══ ══StatsCard══ ═══Dashboard══│
└─────────────────────────────────────────────────────────┘

WEEK 2 — CUSTOMER + VENDOR PRODUCTS
┌─────────────────────────────────────────────────────────┐
│ Dev A: ═══Search══ ══Categories══ ══HomeScreen══ ══AllProducts══│
│ Dev B: ═ProductDetails══ ══ShopScreen══ ══Favorites══  │
│ Dev C: ══CartScreen══ ══CartStore══ ══CartAPI══ ══Coupon══│
│ Dev D: ══AddProduct══ ══ImageUpload══ ══EditProduct══ ══Delete══│
└─────────────────────────────────────────────────────────┘

WEEK 3 — CHECKOUT + VENDOR MANAGEMENT
┌─────────────────────────────────────────────────────────┐
│ Dev A: ══Checkout══ ══OrderSummary══ ══CreateOrder══   │ ← CRITICAL PATH
│ Dev B: ══VendorOrders══ ══OrderDetails══ ══Earnings══  │
│ Dev C: ══Paystack══ ══PaymentScreen══ ══Success/Fail══ │ ← CRITICAL PATH
│ Dev D: ══Dashboard══ ══OrderFilters══ ══StatusUpdate══ ══Withdraw══│
└─────────────────────────────────────────────────────────┘

WEEK 4 — POLISH + SHIP
┌─────────────────────────────────────────────────────────┐
│ Dev A: ══Settings══ ══LoadingStates══ ══SafeArea══ ══SHIP iOS══│
│ Dev B: ══Notifications══ ══Accessibility══ ══Screenshots══ ══SHIP══│
│ Dev C: ══ErrorSweep══ ══PullRefresh══ ══Images══ ══SHIP Android══│
│ Dev D: ══EmptyStates══ ══Keyboard══ ══Stretch══ ══Docs══│
└─────────────────────────────────────────────────────────┘
```

---

## Critical Dependencies

```
Week 1 Day 3:  Dev A delivers navigation + API client → Devs B, C, D unblocked
Week 1 Day 2:  Dev C delivers Button + FormInput → Devs B, D can build screens
Week 2 Day 6:  Dev C delivers CartStore → Dev A can wire Checkout
Week 3 Day 1:  Dev A delivers Checkout → Dev C can integrate Paystack
Week 3 Day 4:  Dev C delivers PaymentScreen → End-to-end purchase flow complete
Week 4 Day 6:  All devs → Final builds
```

## Integration Points

| Point | Dev A provides | Used by | When |
|-------|---------------|---------|------|
| API Client | `api/client.ts` | B, C, D | Week 1 Day 2 |
| Auth Store | `stores/authStore.ts` | B, C, D | Week 1 Day 3 |
| Navigation | `navigation/*` | B, C, D | Week 1 Day 3 |
| Types | `types/index.ts` | B, C, D | Week 1 Day 1 |
| Product Hooks | `hooks/useProducts.ts` | B | Week 2 Day 1 |
| Cart Store | `stores/cartStore.ts` | A (Checkout) | Week 2 Day 6 |
| Order Hooks | `hooks/useOrders.ts` | A, B, C | Week 3 Day 1 |

## Shared Components

| Component | Built by | Used by |
|-----------|----------|---------|
| Button | Dev C | A, B, D |
| FormInput | Dev C | A, B, D |
| LoadingSpinner | Dev C | A, B, D |
| EmptyState | Dev C | A, B, D |
| Badge | Dev C | A |
| Card | Dev C | A, B, D |
| Carousel | Dev C | A, B |
| ProductCard | Dev D (primary) / Dev B | A, B, D |
| ProductGrid | Dev D | A, B, D |
| CartItem | Dev C | C |
| CartSummary | Dev C | A, C |
| StatsCard | Dev D | D |
| OrderStatusBadge | Dev B | B, D |
| SearchBar | Dev A | A |
| CategoryCard | Dev A | A |

---

## Weekly Milestones

### Week 1 ✅
- [ ] Project initialized, all deps installed
- [ ] Theme, types, utilities complete
- [ ] API client with JWT interceptors
- [ ] Auth store + hooks
- [ ] Navigation skeleton (Auth + Customer + Vendor)
- [ ] Launch, Login, Register, ForgotPassword screens
- [ ] All shared UI components built
- [ ] ProductCard, ProductGrid, StatsCard
- [ ] VendorTabs + placeholder CustomerTabs

### Week 2 ✅
- [ ] HomeScreen (search, categories, carousel, top products)
- [ ] ProductDetailsScreen (gallery, info, reviews, cart/wishlist)
- [ ] ShopScreen (product grid, category filter)
- [ ] FavoritesScreen
- [ ] AllProductsScreen
- [ ] CartScreen (add, remove, quantity, coupon)
- [ ] Cart store + API + badge
- [ ] Vendor Dashboard (stats + recent orders)
- [ ] Add/Edit/Delete products with image upload

### Week 3 ✅
- [ ] CheckoutScreen (address, delivery, order summary)
- [ ] PaymentScreen (Paystack WebView integration)
- [ ] Payment success/failure screens
- [ ] Vendor orders list + filters
- [ ] Order details + status update
- [ ] Vendor earnings + withdrawal
- [ ] End-to-end purchase flow tested

### Week 4 ✅
- [ ] Settings screen (shop profile, logout)
- [ ] Notifications screen
- [ ] Error handling sweep (all screens)
- [ ] Loading states sweep
- [ ] Empty states sweep
- [ ] Accessibility pass
- [ ] Real device testing (iOS + Android)
- [ ] App icon + splash screen
- [ ] Store metadata + screenshots
- [ ] iOS build → TestFlight
- [ ] Android build → Play Internal Testing

---

## Risk Watchlist

| Risk | Owner | Check-in Day |
|------|-------|-------------|
| Backend API gaps | Dev D (audit) | Week 1 Day 2 |
| Paystack WebView on real devices | Dev C | Week 3 Day 1 |
| Image upload performance | Dev D | Week 2 Day 4 |
| Dev A bottleneck | All | Week 1 Day 4 |
| Token refresh edge cases | Dev A | Week 1 Day 4 |

---

## Communication Cadence

- **Daily standup:** 9:00 AM, 10 minutes max
- **PR reviews:** Within 4 hours of submission
- **Blockers:** Message in team chat immediately, @mention Dev A if API/infra related
- **Week retrospectives:** Friday 4:00 PM, 30 min

---

_All four individual sprint files are in this directory. Each dev should read their file in full before Day 1._
