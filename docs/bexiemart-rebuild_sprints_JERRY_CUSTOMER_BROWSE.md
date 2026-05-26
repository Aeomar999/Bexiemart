# Sprint Plan — Jerry: Customer Browse Lead

**Role:** Frontend Developer — Customer Experience  
**Domains:** Authentication screens, Home tab, Shop tab, Product Details, All Products, Favorites, Notifications  
**Dependencies:** Blocked by Dev A until Day 3 (navigation + API client + types)  
**Key Deliverables:** Auth UI screens, HomeScreen, ShopScreen, ProductDetailsScreen, AllProductsScreen, FavoritesScreen, NotificationsScreen

---

## Week 1 — Auth Screens & Setup

### Day 1: Environment & Research

| Task ID | Task | Effort | Acceptance Criteria |
|---------|------|--------|---------------------|
| B-1.1 | Set up dev environment | 2h | Expo CLI installed. Project cloned. `npx expo start` runs on simulator/emulator. Both iOS and Android simulators working. |
| B-1.2 | Screenshot all Flutter auth screens for reference | 1h | Screenshots of: Launch, Login, Register, ForgotPassword (all 3 steps), Onboarding. Saved to `reference/flutter-screenshots/auth/`. |
| B-1.3 | Study Flutter theme system | 1h | Understand: which font is used where (Raleway vs Nunito), text sizes per element, color usage, spacing patterns, border radius defaults. Document findings in `reference/design-notes.md`. |
| B-1.4 | Study TypeScript types from Dev A | 1h | Review `src/types/index.ts`. Understand: `User` interface, `AuthTokens` shape, `ApiResponse<T>` wrapper. Ask Dev A any questions. |
| B-1.5 | Review React Navigation docs — native stack + bottom tabs | 2h | Read React Navigation 7 docs. Understand: `createNativeStackNavigator`, `createBottomTabNavigator`, `navigation.navigate` with params, `useRoute` for reading params. |

**End of Day 1 Deliverable:** Environment ready. Design reference documented. Types understood.

---

### Day 2: Launch Screen

| Task ID | Task | Files to Create | Effort | Acceptance Criteria |
|---------|------|----------------|--------|---------------------|
| B-2.1 | Build LaunchScreen | `src/screens/auth/LaunchScreen.tsx` | 4h | Layout (top to bottom): ① Centered logo (100×100, rounded corners `borderRadius: 50`). Image source: `assets/images/appLogo.jpg` from Flutter. ② "BexieMart" text: Raleway, 52px, weight 500, letterSpacing -0.52. ③ Tagline: "Shop Smart, Live Easy - Your Campus Marketplace": Nunito, 19px, weight 300, centered, max width 249. ④ "Get Started" Button: primary, width 330, height 54, bottom-aligned. `onPress → navigate('Register')`. ⑤ "I already have an account" text + arrow icon: Nunito 16px weight 300. `onPress → navigate('Login')`. Arrow uses `Ionicons arrow-forward`. Spacing between sections: logo→title (0), title→tagline (12), tagline→buttons (flex spacer), button→link (12), link→bottom (64). |
| B-2.2 | Test LaunchScreen visual parity | — | 1h | Side-by-side comparison with Flutter Launch screen screenshot. Verify: colors (#0000FF primary, #202020 text), fonts, sizes, spacing, border radii. Fix discrepancies. |
| B-2.3 | Ensure LaunchScreen renders in AuthNavigator | Verify with Dev A | 30m | Confirm LaunchScreen is the initial route in AuthNavigator. Test navigation to Register and Login. |

**End of Day 2 Deliverable:** Launch screen matches Flutter pixel-perfect.

---

### Day 3: Login Screen

| Task ID | Task | Files to Create | Effort | Acceptance Criteria |
|---------|------|----------------|--------|---------------------|
| B-3.1 | Build LoginScreen | `src/screens/auth/LoginScreen.tsx` | 5h | **Header:** Back button (Ionicons arrow-back) with "Back" text (Nunito 20px weight 500). `onPress → navigation.goBack()`. **Body (ScrollView):** ① "Login" heading: Raleway 24px weight 700. ② "Good To See You Back! 🖤": Nunito 19px weight 300. ③ Email FormInput: label "Email", hint "Enter your email", keyboard email, validate not empty. ④ Password FormInput: label "Password", hint "Enter your password", secureTextEntry, visibility toggle icon (eye/eye-off). ⑤ "Forgot Password?" TextButton (primary color). `onPress → navigate('ForgotPassword')`. **Bottom:** ⑥ "Login" Button (300×50, primary). Loading spinner when `isLoading=true`. `onPress → useLogin(email, password)`. On success → role-based redirect. ⑦ "Don't have an account? Register" TextButton. `onPress → navigate('Register')`. **States:** idle, loading (button spinner + disabled), error (red text below button), success (navigate away). |
| B-3.2 | Integrate with Dev A's auth hooks | `src/screens/auth/LoginScreen.tsx` (wire) | 1h | Import `useLogin` from `src/hooks/useAuth`. Wire form submit to mutation. Display API error from `mutation.error`. Redirect on `mutation.isSuccess`: if `user.isFirstTimeUser` → navigate to Onboarding (placeholder for now) → then Home. Otherwise → straight to Home. |
| B-3.3 | Visual parity check | — | 1h | Compare to Flutter Login screenshot. Verify: back button style, heading sizes, spacing between fields (12px), button dimensions, link text styles. |

**End of Day 3 Deliverable:** Login screen works with real API. Error/loading states functional.

---

### Day 4: Register Screen

| Task ID | Task | Files to Create | Effort | Acceptance Criteria |
|---------|------|----------------|--------|---------------------|
| B-4.1 | Build RegisterScreen | `src/screens/auth/RegisterScreen.tsx` | 5h | **Header:** Same pattern as Login (Back button + "Back"). **Body (ScrollView):** ① "Create Account" heading: Raleway 24px weight 700. ② Subtitle: "Join the campus marketplace" Nunito 19px weight 300. ③ Full Name FormInput: label "Full Name", hint "Enter your full name", validate not empty. ④ Email FormInput: label "Email", hint "Enter your email", keyboard email. ⑤ Phone FormInput: label "Phone Number", hint "Enter your phone number", keyboard phone. ⑥ Password FormInput: label "Password", hint "Create a password", secure, min 6 chars. ⑦ Confirm Password FormInput: label "Confirm Password", must match password. ⑧ Role selector: two option cards — "I want to shop" (customer) and "I want to sell" (vendor). Radio-style selection with primary border on selected. **Bottom:** ⑨ "Create Account" Button. Loading state. `onPress → useRegister(data)`. On success → navigate to Login (with success message). ⑩ "Already have an account? Login" TextButton. |
| B-4.2 | Build Zod validation schema for register | `src/utils/validation.ts` (add) | 1h | `registerSchema`: name (min 2 chars), email (valid email), phone (min 10 digits), password (min 6 chars), confirmPassword (matches password), role (enum: 'customer' | 'vendor'). All with custom error messages. |
| B-4.3 | Integrate with auth hooks | `src/screens/auth/RegisterScreen.tsx` (wire) | 1h | Wire form to `useRegister` mutation. Zod validation on submit. API error display. Success → navigate to Login with "Account created! Please log in." |

**End of Day 4 Deliverable:** Registration works with validation. Role selection functional.

---

### Day 5: Forgot Password UI

| Task ID | Task | Files to Create | Effort | Acceptance Criteria |
|---------|------|----------------|--------|---------------------|
| B-5.1 | Build ForgotPasswordScreen UI | `src/screens/auth/ForgotPasswordScreen.tsx` | 2.5h | Work with Dev A (who owns API wiring). Screen: background image at top (`forgot_pass.jpg`, 250×250 centered), "Forgot Password?" heading (Raleway 24px), "Enter your email to receive a reset link" subtitle (Nunito 16px), email FormInput, "Send Reset Link" Button. |
| B-5.2 | Build PasswordVerifyScreen UI | `src/screens/auth/PasswordVerifyScreen.tsx` | 2h | "Verify It's You" heading. "Enter the 6-digit code sent to your email" subtitle. 6-box pin code input (using `react-native-otp-input` or custom). "Verify" Button. "Didn't receive code? Resend in 60s" with countdown. |
| B-5.3 | Build NewPasswordScreen UI | `src/screens/auth/NewPasswordScreen.tsx` | 2h | "Set New Password" heading. Password FormInput (with visibility toggle). Confirm Password FormInput. Validation: min 6 chars, passwords match. "Reset Password" Button. |
| B-5.4 | Auth screen polish pass | `src/screens/auth/` (all) | 1h | Verify all screens: KeyboardAvoidingView on all forms. ScrollView on all screens. SafeArea applied. No text cutoff on small screens (iPhone SE). Dark mode: force light mode for v1 (`backgroundColor: #FFFFFF`). |

**End of Day 5 Deliverable:** All auth screens built. UI complete. Dev A handles API wiring.

---

### Day 6: Auth Polish & Testing

| Task ID | Task | Files | Effort | Acceptance Criteria |
|---------|------|-------|--------|---------------------|
| B-6.1 | Auth flow integration testing | — | 2h | Test: Launch → Register (customer) → redirected to Login → login → CustomerTabs. Launch → Register (vendor) → Login → VendorTabs. Launch → Login (wrong password) → error message. Launch → Login (no email) → validation error. Launch → ForgotPassword → enter email → token → new password → Login (new password works). |
| B-6.2 | Accessibility pass on auth screens | `src/screens/auth/` (all) | 1.5h | Add `accessibilityLabel` to all images. Add `accessibilityHint` to all buttons. FormInputs have `accessibilityLabel`. Error messages announced. Touch targets ≥44×44. |
| B-6.3 | Cross-platform test (iOS + Android) | — | 1h | Run all auth screens on iOS simulator + Android emulator. Verify: fonts load correctly (Raleway + Nunito), colors consistent, safe area handling correct on both. |
| B-6.4 | Document auth screen states | `sprints/notes/auth-screen-states.md` | 1.5h | Document for each screen: loading state, empty state, error state, success state, edge cases (keyboard open, rotation, small screen). Screenshots of each. |

**End of Day 6 Deliverable:** Auth screens are production-ready. Accessible. Documented.

---

### Day 7: Buffer & Prep for Week 2

| Task ID | Task | Effort | Acceptance Criteria |
|---------|------|--------|---------------------|
| B-7.1 | Review Dev A's navigation + types PR | 1h | Verify auth navigator routes match screen implementations. Check type safety on navigation params. |
| B-7.2 | Screenshot Flutter customer screens | 1.5h | Screenshots of: Home (full scroll), Shop, Product Details, All Products (category view), Favorites, Cart, Notifications. Save to `reference/flutter-screenshots/customer/`. |
| B-7.3 | Study product API response shapes | 1.5h | Review Prisma Product model. Understand: `images` (array of URLs), `category` (nested object), `shop` (nested object with vendor), `deliveryOptions` (array), `reviews` (array). |
| B-7.4 | Plan Week 2 component hierarchy | 1h | Sketch component tree: HomeScreen → SearchBar (Dev A) + Carousel (Dev A) + CategorySection → CategoryCard (Dev A) + ProductSection → ProductCard (self) + "See All". Identify which components Dev A provides vs builds self. |
| B-7.5 | Study expo-image API | 1h | Learn: `contentFit`, `placeholder`, `transition`, `recyclingKey`. Will be used extensively in product images. |

**End of Week 1 Milestone:** ✅ Auth screens complete, pixel-perfect, accessible, tested on both platforms.

---

## Week 2 — Customer Browsing Experience

| Day | Task ID | Task | Files | Acceptance Criteria |
|-----|---------|------|-------|---------------------|
| 1 | B-2.1 | Build ProductDetailsScreen — image gallery | `src/screens/customer/ProductDetailsScreen.tsx` | Full-width swipeable image carousel using FlatList (horizontal, pagingEnabled). Dot indicators below. Each image: `expo-image` with `contentFit="cover"`. Placeholder: grey skeleton. Error fallback: broken image icon. |
| 1 | B-2.2 | Build ProductDetailsScreen — info section | `src/screens/customer/ProductDetailsScreen.tsx` (continue) | Below gallery: Product name (Raleway 22px bold). Price (Nunito 18px, primary color). Original price with strikethrough if discounted (textSecondary). Discount badge ("-20%" in red). Stock status: "In Stock" (green) or "Out of Stock" (red). Description (Nunito 14px, collapsible if >3 lines). Color display (colored circle). |
| 2 | B-2.3 | Build ProductDetailsScreen — seller section | `src/screens/customer/ProductDetailsScreen.tsx` (continue) | "Sold by" label. Shop logo (40×40 circle, expo-image). Shop name (Nunito 16px medium). Contact button (outline). Tap shop name → placeholder for now. |
| 2 | B-2.4 | Build ProductDetailsScreen — reviews section | `src/screens/customer/ProductDetailsScreen.tsx` (continue) | Average rating (star icon + number). Rating distribution bars (1-5 stars). Review list: each shows reviewer name, star rating, comment text, date. "See all reviews" if >3. |
| 3 | B-2.5 | Build ProductDetailsScreen — delivery options | `src/screens/customer/ProductDetailsScreen.tsx` (continue) | "Delivery Options" heading. List of options: each shows type (e.g. "Standard"), fee (GHS), estimated time (e.g. "2-3 days"). Icons differentiate types. |
| 3 | B-2.6 | Build ProductDetailsScreen — bottom bar | `src/screens/customer/ProductDetailsScreen.tsx` (continue) | Sticky bottom bar: quantity selector (- / number / +) with stock limit enforcement. "Add to Cart" Button (primary, takes remaining width). Heart icon (wishlist toggle, filled red if favorited). |
| 3 | B-2.7 | Wire product detail API | `src/hooks/useProducts.ts` (use) | Use Dev A's `useProduct(id)` hook. Screen receives `productId` via route params. All sections populate from API response. Loading skeleton while fetching. Error state with retry. |
| 4 | B-2.8 | Build ShopScreen — product grid | `src/screens/customer/ShopScreen.tsx` | Paginated `FlatList` with 2 columns. Each item: `ProductCard` component. Pull-to-refresh. Load more on scroll end (`onEndReached`). Loading footer spinner. |
| 4 | B-2.9 | Build ShopScreen — category filter | `src/screens/customer/ShopScreen.tsx` (continue) | Horizontal scrollable row of filter chips above grid. "All" chip (selected by default). One chip per category from `useCategories()`. Tap chip → filter grid to that category. Selected chip: primary bg + white text. Unselected: grey bg + dark text. |
| 5 | B-2.10 | Build ProductCard component (shared) | `src/components/product/ProductCard.tsx` | Card with: image (expo-image, 100% width, aspect 1:1), discount badge (top-left corner, red, only if discount >0), favorite icon (top-right, heart toggle), product name (Nunito 14px medium, max 2 lines), price (Nunito 16px bold, primary color), rating (star + number). `onPress` → ProductDetails. `onFavorite` → toggle wishlist. Compact variant for horizontal lists (height ~100). |
| 6 | B-2.11 | Build FavoritesScreen | `src/screens/customer/FavoritesScreen.tsx` | Grid of favorited products (2 columns, ProductCard). Each card's heart is already filled. Swipe to remove or "x" button. Empty state: EmptyState component with `favorites.jpg` image, "No favorites yet", "Browse Products" button → Shop tab. Uses `useWishlist()` hook. |
| 6 | B-2.12 | Wire wishlist API | `src/hooks/useProducts.ts` (add) | `useWishlist()`: query → GET /wishlist. `useAddToWishlist()`: mutation → POST /wishlist { productId }. `useRemoveFromWishlist()`: mutation → DELETE /wishlist/:id. Optimistic update on toggle. |
| 7 | B-2.13 | Cross-screen navigation testing | — | Test: Home → tap category → AllProducts → tap product → ProductDetails → add to cart → cart badge updates. Home → tap product → ProductDetails → favorite → go to Favorites → product appears. Shop → filter by category → tap product → details. Verify all navigation params pass correctly. |
| 7 | B-2.14 | Buffer: performance + edge cases | — | Test ProductDetails with many images (5+). Shop grid scroll performance with 100+ products. Empty states on all screens. Pull-to-refresh everywhere. |

**End of Week 2 Deliverable:** Full browsing experience. Search, categories, shop, product details, favorites. All with live API.

---

## Week 3 — Orders, Earnings & Polish

| Day | Task ID | Task | Files | Acceptance Criteria |
|-----|---------|------|-------|---------------------|
| 1 | B-3.1 | Build vendor orders list | `src/screens/vendor/OrdersScreen.tsx` | FlatList of orders. Each item: order ID (#), date, total amount, number of items, status badge. Status filter tabs at top: All, Pending, Confirmed, Processing, Shipped, Delivered, Cancelled. |
| 1 | B-3.2 | Build OrderStatusBadge component | `src/components/vendor/OrderStatusBadge.tsx` | Color-coded badges: pending (yellow), confirmed (blue), processing (orange), shipped (purple), delivered (green), cancelled (red). Rounded pill shape. Text: status name. |
| 2 | B-3.3 | Build OrderDetailsScreen | `src/screens/vendor/OrderDetailsScreen.tsx` | Sections: ① Order ID + date. ② Items list: each shows product image, name, qty, price, subtotal. ③ Customer info: name, phone, address. ④ Payment: method, status, total. ⑤ Delivery: option, fee, status. ⑥ Order status update: dropdown or buttons to advance status. |
| 3 | B-3.4 | Wire vendor orders API | `src/hooks/useOrders.ts` (use) | `useVendorOrders(status?)`: query → GET /vendor/orders. `useOrderDetail(id)`: query → GET /orders/:id. `useUpdateOrderStatus()`: mutation → PATCH /orders/:id/status. Optimistic update on status change. |
| 4 | B-3.5 | Build vendor earnings overview | `src/screens/vendor/EarningsScreen.tsx` | Stats cards: Total Earned, Pending Commission, Total Withdrawn (using StatsCard component). Below: transaction history FlatList. Each row: date, amount (green), order reference, type (sale/referral). |
| 5 | B-3.6 | Build withdrawal flow | `src/screens/vendor/EarningsScreen.tsx` (continue) | "Withdraw" button. Bottom sheet/modal: amount input, select destination (bank or mobile money), confirm button. Show available balance. Validate: amount > 0, amount ≤ available. Success → show receipt. |
| 6 | B-3.7 | Wire vendor earnings API | `src/hooks/useOrders.ts` (add) | `useVendorEarnings()`: query → GET /vendor/earnings. `useWithdraw()`: mutation → POST /vendor/earnings/withdraw. |
| 7 | B-3.8 | Integration testing (vendor flows) | — | Test: vendor dashboard loads stats. Products CRUD works. Orders list → details → status update. Earnings display + withdrawal. Cross-role: place order as customer → appears in vendor orders. |

**End of Week 3 Deliverable:** Vendor orders + earnings screens functional.

---

## Week 4 — Notifications & Polish

| Day | Task ID | Task | Files | Acceptance Criteria |
|-----|---------|------|-------|---------------------|
| 1 | B-4.1 | Build NotificationsScreen | `src/screens/shared/NotificationsScreen.tsx` | FlatList of notifications. Each: bold title (unread) / normal (read), message body, timestamp ("2h ago"). Tap → mark as read (visual change + API call). Empty state: "No notifications". Accessible from both Customer tabs (AppBar icon) and Vendor tabs (AppBar icon). |
| 1 | B-4.2 | Wire notifications API | `src/hooks/useNotifications.ts` | `useNotifications()`: query → GET /notifications. `useMarkAsRead()`: mutation → PATCH /notifications/:id/read. |
| 2 | B-4.3 | Form validation sweep (Zod) | All screens with forms | Verify every FormInput has a Zod schema. Custom error messages are user-friendly ("Please enter a valid email address", not "Invalid email format"). Errors appear below fields, not in toasts. |
| 3 | B-4.4 | Accessibility pass — all customer screens | `src/screens/customer/` (all) | Every image has `accessibilityLabel`. Every button has `accessibilityHint`. ProductCard: "Product name, price X GHS, rating Y stars". CartItem: "Name, quantity X, price Y, remove button". Screen reader announces screen title on focus. |
| 4 | B-4.5 | Build and test on real iOS device | — | `eas build --platform ios --profile development`. Install on iPhone. Test: full customer flow, auth flow, all screens, payment (test mode). Document any issues. |
| 5 | B-4.6 | App Store screenshots | — | Capture screenshots for App Store Connect: 6.7" (iPhone 15 Pro Max), 6.5" (iPhone 14 Plus), 5.5" (iPhone 8 Plus). Screens: Launch, Home, Product Details, Cart, Vendor Dashboard. |
| 6 | B-4.7 | Regression testing | — | Run through handoff checklist. Test: register → browse → cart → checkout → payment → order confirmed. Vendor: add product → view order → update status → view earnings. All states: loading, empty, error. |
| 7 | B-4.8 | Ship support | — | Assist Dev A with App Store submission. Verify metadata, screenshots, description. Standby for TestFlight review issues. |

**End of Week 4 Deliverable:** App shipped. Notifications working. All customer + vendor screens accessible.

---

## Dev B — Components Owned

| Component | File | Variants |
|-----------|------|----------|
| ProductCard | `src/components/product/ProductCard.tsx` | Default (grid, 2-col), Compact (horizontal list, height 100) |
| OrderStatusBadge | `src/components/vendor/OrderStatusBadge.tsx` | 7 status variants |

## Dev B — Screens Owned

| Screen | File | Route |
|--------|------|-------|
| LaunchScreen | `src/screens/auth/LaunchScreen.tsx` | `Launch` |
| LoginScreen | `src/screens/auth/LoginScreen.tsx` | `Login` |
| RegisterScreen | `src/screens/auth/RegisterScreen.tsx` | `Register` |
| ForgotPasswordScreen | `src/screens/auth/ForgotPasswordScreen.tsx` | `ForgotPassword` |
| PasswordVerifyScreen | `src/screens/auth/PasswordVerifyScreen.tsx` | `PasswordVerify` |
| NewPasswordScreen | `src/screens/auth/NewPasswordScreen.tsx` | `NewPassword` |
| ProductDetailsScreen | `src/screens/customer/ProductDetailsScreen.tsx` | `ProductDetails` |
| ShopScreen | `src/screens/customer/ShopScreen.tsx` | Customer Tab 2 |
| FavoritesScreen | `src/screens/customer/FavoritesScreen.tsx` | Customer Stack |
| OrdersScreen | `src/screens/vendor/OrdersScreen.tsx` | Vendor Tab 3 |
| OrderDetailsScreen | `src/screens/vendor/OrderDetailsScreen.tsx` | Vendor Stack |
| EarningsScreen | `src/screens/vendor/EarningsScreen.tsx` | Vendor Tab 4 |
| NotificationsScreen | `src/screens/shared/NotificationsScreen.tsx` | Shared Stack |

---

## Dev B — API Modules to Integrate

| API | Hook | Used In |
|-----|------|---------|
| GET /products/:id | `useProduct(id)` (Dev A hook) | ProductDetailsScreen |
| GET /wishlist | `useWishlist()` | FavoritesScreen, ProductCard |
| POST /wishlist | `useAddToWishlist()` | ProductDetailsScreen, ProductCard |
| DELETE /wishlist/:id | `useRemoveFromWishlist()` | FavoritesScreen |
| GET /vendor/orders | `useVendorOrders()` | OrdersScreen |
| GET /orders/:id | `useOrderDetail()` | OrderDetailsScreen |
| PATCH /orders/:id/status | `useUpdateOrderStatus()` | OrderDetailsScreen |
| GET /vendor/earnings | `useVendorEarnings()` | EarningsScreen |
| POST /vendor/earnings/withdraw | `useWithdraw()` | EarningsScreen |
| GET /notifications | `useNotifications()` | NotificationsScreen |
| PATCH /notifications/:id/read | `useMarkAsRead()` | NotificationsScreen |

---

## Daily Standup Notes Template

```
Dev B — Day X
✅ Done yesterday: [list]
🚧 Doing today: [list]
⛔ Blockers: [list or "none"]
📞 Need from: [Dev A/C/D — specific ask]
```

---

_Generated from BexieMart PRD v1.0. April 27, 2026._
