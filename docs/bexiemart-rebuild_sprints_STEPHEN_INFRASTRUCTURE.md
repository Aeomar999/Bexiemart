# Sprint Plan — Stephen: Infrastructure & Auth Lead

**Role:** Infrastructure Lead / Full-Stack  
**Domains:** Navigation, API Layer, State Management, Theme, Types, Auth, Checkout, Settings  
**Dependencies:** Blocks all other devs in Week 1  
**Key Deliverables:** `api/client.ts`, `stores/`, `navigation/`, `theme/`, `types/`

---

## Week 1 — Foundation & Auth

### Day 1: Project Initialization & Architecture Setup

| Task ID | Task | Files to Create | Effort | Acceptance Criteria |
|---------|------|----------------|--------|---------------------|
| A-1.1 | Initialize Expo project with TypeScript template | `app.json`, `tsconfig.json`, `package.json`, `App.tsx` | 2h | `npx expo start` runs without errors. TypeScript strict mode enabled. |
| A-1.2 | Install all project dependencies | `package.json` (updated) | 1h | All deps from stack list installed: `@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack`, `@tanstack/react-query`, `zustand`, `axios`, `react-hook-form`, `zod`, `expo-image`, `expo-image-picker`, `expo-secure-store`, `expo-font`, `react-native-webview` |
| A-1.3 | Create folder structure with path aliases | `src/navigation/`, `src/screens/`, `src/components/`, `src/api/`, `src/hooks/`, `src/stores/`, `src/theme/`, `src/types/`, `src/utils/` | 30m | All folders created. `tsconfig.json` path aliases (`@/` → `src/`) configured. |
| A-1.4 | Create theme files | `src/theme/colors.ts`, `src/theme/typography.ts`, `src/theme/spacing.ts` | 1h | All design tokens exported. Color constants match Flutter enums. Typography exports `fontFamily`, `fontSize`, `fontWeight` objects. Spacing exports numeric scale. |
| A-1.5 | Create base TypeScript types | `src/types/index.ts` | 1.5h | Interfaces for: `User`, `Product`, `Category`, `Shop`, `Order`, `CartItem`, `Review`, `AuthTokens`, `ApiResponse<T>`, `PaginatedResponse<T>`. All match Prisma schema shapes. |
| A-1.6 | Create utility modules | `src/utils/storage.ts`, `src/utils/format.ts`, `src/utils/constants.ts` | 1h | `storage.ts`: `saveTokens()`, `getTokens()`, `clearTokens()`, `saveUser()`, `getUser()`. `format.ts`: `formatCurrency(amount, currency='GHS')`, `formatDate(isoString)`. `constants.ts`: `API_BASE_URL`, `PAYSTACK_PUBLIC_KEY`. |

**End of Day 1 Deliverable:** Project runs. Theme tokens ready. Types defined. Utilities working.

---

### Day 2: API Layer & Auth Foundation

| Task ID | Task | Files to Create | Effort | Acceptance Criteria |
|---------|------|----------------|--------|---------------------|
| A-2.1 | Build Axios client with JWT interceptors | `src/api/client.ts` | 2h | `apiClient` instance: `baseURL` from constants. Request interceptor injects `Authorization: Bearer <token>`. Response interceptor: on 401 → attempt token refresh → retry original request → if refresh fails → clear tokens + redirect to login. Timeout set to 15s. |
| A-2.2 | Build auth API module | `src/api/auth.ts` | 1h | Functions: `login(email, password) → Promise<AuthResponse>`, `register(data) → Promise<AuthResponse>`, `forgotPassword(email) → Promise<void>`, `resetPassword(token, password) → Promise<void>`, `getMe() → Promise<User>`. All use `apiClient` from `client.ts`. |
| A-2.3 | Build auth store (Zustand) | `src/stores/authStore.ts` | 1h | State: `user: User | null`, `accessToken: string | null`, `refreshToken: string | null`, `isAuthenticated: boolean`, `isLoading: boolean`. Actions: `login()`, `register()`, `logout()`, `setUser()`, `hydrate()` (restore from secure storage). Computed: `isCustomer`, `isVendor` based on `user.role`. |
| A-2.4 | Build auth hooks (TanStack Query) | `src/hooks/useAuth.ts` | 1.5h | `useLogin()`: mutation, stores tokens in Zustand + secure storage. `useRegister()`: mutation. `useLogout()`: clears Zustand + secure storage. `useCurrentUser()`: query, fetches `GET /auth/me`, updates Zustand. Handles loading/error states. |
| A-2.5 | Create secure storage wrappers | `src/utils/storage.ts` (expand) | 30m | Test save/retrieve of dummy tokens. Verify they survive app restart. |

**End of Day 2 Deliverable:** API client handles auth flow. Tokens stored securely. Auth store ready.

---

### Day 3: Navigation Skeleton

| Task ID | Task | Files to Create | Effort | Acceptance Criteria |
|---------|------|----------------|--------|---------------------|
| A-3.1 | Build RootNavigator | `src/navigation/RootNavigator.tsx` | 1.5h | Checks `authStore.isAuthenticated`. If false → renders `AuthNavigator`. If true → renders `CustomerTabs` or `VendorTabs` based on `user.role`. Shows loading spinner while hydrating auth state on app launch. |
| A-3.2 | Build AuthNavigator (native stack) | `src/navigation/AuthNavigator.tsx` | 1h | Stack with 4 routes: `Launch` (initial), `Login`, `Register`, `ForgotPassword`. Screen options: `headerShown: false` for Launch, default header with back button for others. Route param types defined. |
| A-3.3 | Build CustomerTabs (bottom tabs) | `src/navigation/CustomerTabs.tsx` | 1.5h | 5 tabs: Home (house icon), Shop (bag icon), placeholder (empty for now), placeholder (empty), placeholder (empty). Tabs 3-5 use empty views that show "Coming Soon". Active tab: `#004CFF`, inactive: `#686262`. AppBar with "BexieMart" title, favorites heart icon (with badge), cart icon (with badge). Cart badge reads from `cartStore.itemCount`. |
| A-3.4 | Build VendorTabs (bottom tabs) | `src/navigation/VendorTabs.tsx` | 1.5h | 5 tabs: Dashboard (dashboard icon), Products (bag icon), Orders (receipt icon), Earnings (money icon), Settings (gear icon). Active tab: `#004CFF`, inactive: `#686262`. AppBar with "BexieMart" title, profile image (cached), notification bell icon (with badge). |
| A-3.5 | Wire navigation to App.tsx | `App.tsx` (update) | 30m | `App.tsx` renders `QueryClientProvider` (TanStack Query) → `NavigationContainer` → `RootNavigator`. `expo-font` loads Raleway + Nunito before render. Splash screen hidden after fonts loaded. |

**End of Day 3 Deliverable:** App navigates between auth and main flows. Tab bars render correctly. Role-based routing works.

---

### Day 4: Token Refresh & Auth Flow Testing

| Task ID | Task | Files to Create/Modify | Effort | Acceptance Criteria |
|---------|------|----------------------|--------|---------------------|
| A-4.1 | Implement token refresh logic | `src/api/client.ts` (expand) | 2h | Interceptor detects 401. Calls `POST /auth/refresh` with refresh token. If successful, updates stored tokens, retries original request. If refresh fails, calls `authStore.logout()`. Prevents infinite refresh loops (max 1 retry). Queue concurrent 401s so only one refresh call happens. |
| A-4.2 | Add route guards | `src/navigation/RootNavigator.tsx` (expand) | 1h | Customer tab navigator → redirects vendors to VendorTabs. Vendor tab navigator → redirects customers to CustomerTabs. Uses `authStore.user?.role` to decide. |
| A-4.3 | Auth flow integration testing | — | 2h | Register a customer → verify redirect to CustomerTabs. Register a vendor → verify redirect to VendorTabs. Login → verify redirect. Kill app → reopen → verify still authenticated (hydrate from secure storage). Invalid login → verify error message. Network off during login → verify error state. |
| A-4.4 | Create useAuth tests (manual test script) | `sprints/test-scripts/auth-flow.md` | 1h | Document step-by-step test cases: happy path, error cases, edge cases. |

**End of Day 4 Deliverable:** Auth is bulletproof. Tokens persist. Refresh works. Role routing correct.

---

### Day 5: Forgot Password Flow

| Task ID | Task | Files to Create | Effort | Acceptance Criteria |
|---------|------|----------------|--------|---------------------|
| A-5.1 | Build ForgotPasswordScreen (step 1: email input) | `src/screens/auth/ForgotPasswordScreen.tsx` | 1.5h | Text: "Forgot Password?". Email FormInput with validation. "Send Reset Link" Button. On success → navigate to step 2. Loading state on button. Error display below form. |
| A-5.2 | Build PasswordVerifyScreen (step 2: token input) | `src/screens/auth/PasswordVerifyScreen.tsx` | 1.5h | Text: "Verify It's You". Token/pin input (4-6 digit code field). "Verify" Button. On success → navigate to step 3. Resend code link with 60s cooldown. |
| A-5.3 | Build NewPasswordScreen (step 3: new password) | `src/screens/auth/NewPasswordScreen.tsx` | 1.5h | Text: "Set New Password". Password FormInput with visibility toggle. Confirm password FormInput. Validation: min 6 chars, passwords match. "Reset Password" Button. On success → navigate to Login with success toast. |
| A-5.4 | Wire forgot password navigation | `src/navigation/AuthNavigator.tsx` (update) | 30m | Add step 1 → step 2 → step 3 navigation with params (email, recoveryType). |
| A-5.5 | Forgot password integration testing | — | 1.5h | Test full flow: email → token → new password → login with new password. Invalid token → error. Expired token → error. Network errors at each step. |

**End of Day 5 Deliverable:** Complete forgot password flow works end-to-end.

---

### Day 6: Route Guards & Auth Polish

| Task ID | Task | Files to Create/Modify | Effort | Acceptance Criteria |
|---------|------|----------------------|--------|---------------------|
| A-6.1 | Customer route guard | `src/navigation/CustomerTabs.tsx` (update) | 1h | If `user.role !== 'customer'`, redirect to appropriate tab navigator. Prevents vendors from accessing customer screens via deep links. |
| A-6.2 | Vendor route guard | `src/navigation/VendorTabs.tsx` (update) | 1h | If `user.role !== 'vendor'`, redirect to appropriate tab navigator. |
| A-6.3 | Auth screen polish — visual parity check | `src/screens/auth/` (all files) | 2h | Compare each auth screen to Flutter screenshots. Verify: colors match exactly, font families correct (Raleway headings, Nunito body), font sizes match Flutter, spacing/padding match, button styles match (width, height, border radius). Fix any discrepancies. |
| A-6.4 | Loading states for all auth screens | `src/screens/auth/` (all files) | 1h | Every button shows spinner when loading. Every button disabled during API call. No double-submit possible. Keyboard dismisses on submit. |
| A-6.5 | PR review: Dev B's Launch + Login screens | — | 1h | Review against Flutter screenshots. Check TypeScript types. Verify API integration. |

**End of Day 6 Deliverable:** Auth fully polished. Route guards active. Visual parity confirmed.

---

### Day 7: Buffer & Integration

| Task ID | Task | Files | Effort | Acceptance Criteria |
|---------|------|-------|--------|---------------------|
| A-7.1 | Integration fixes from Dev B, C, D feedback | Various | 3h | Fix any issues reported with `api/client.ts`, navigation setup, types, stores. |
| A-7.2 | Review and merge Week 1 PRs | — | 2h | All Week 1 PRs reviewed. At least 1 approval each. Merged to `main`. |
| A-7.3 | Update types with any new shapes discovered | `src/types/index.ts` | 1h | Add types for: `Notification`, `Coupon`, `Earning`, `Wallet`, `PaymentMethod`, `DeliveryOption` — needed by Devs B, C, D in Week 2. |
| A-7.4 | Prepare Week 2 checklist | — | 1h | Confirm all Week 1 milestones met. Brief Dev B, C, D on any API client gotchas. |

**End of Week 1 Milestone:** ✅ Register, login, role-based routing, JWT persistence. Component library built. Navigation skeleton complete. All types defined.

---

## Week 2 — Search, Categories & Checkout Setup

| Day | Task ID | Task | Files | Acceptance Criteria |
|-----|---------|------|-------|---------------------|
| 1 | A-2.1 | Build search API module | `src/api/products.ts` | `searchProducts(query: string) → Promise<Product[]>`. Debounced at 300ms. Returns products where `name` or `category.name` contains query. |
| 1 | A-2.2 | Build SearchBar component | `src/components/ui/SearchBar.tsx` | Rounded TextInput with search icon. Real-time results dropdown (FlatList). Each result: product image thumbnail + name + price. Tap → navigate to ProductDetails. Empty state: "No results for '<query>'". Loading spinner while fetching. Closes dropdown on blur or cancel. |
| 2 | A-2.3 | Build category API hook | `src/hooks/useProducts.ts` | `useCategories()`: TanStack Query, `GET /products/categories`. Returns `Category[]`. Cached for 5 min. |
| 2 | A-2.4 | Build CategoryCard component | `src/components/product/CategoryCard.tsx` | Card with 2×2 grid of category product thumbnails (first 4). Category name below. Product count badge. Tap → AllProducts with category filter. Horizontal scroll in parent. |
| 3 | A-2.5 | Build top products section | `src/hooks/useProducts.ts` (expand) | `useTopProducts()`: fetches products sorted by rating DESC, limit 10. TanStack Query with staleTime 2min. |
| 3 | A-2.6 | Build TopProductsList component | `src/components/product/TopProductsList.tsx` | Horizontal FlatList. Each item: ProductCard (compact variant). "See All" button → AllProducts("Top Products"). |
| 4 | A-2.7 | Build ad carousel | `src/components/ui/Carousel.tsx` (expand) | Auto-scrolling. Dot indicators. 5s interval. Hardcoded promo images for v1. Wrap in container with rounded corners. |
| 5 | A-2.8 | Assemble HomeScreen | `src/screens/customer/HomeScreen.tsx` | ScrollView: SearchBar → Carousel → Categories ("See All") → Top Products ("See All"). Pull-to-refresh refreshes all sections. Each section shows loading skeleton while fetching. |
| 6 | A-2.9 | Build AllProductsScreen | `src/screens/customer/AllProductsScreen.tsx` | Receives params: `title`, `items` (or `category`). Header with `title` and back button. ProductGrid with the filtered products. Pull-to-refresh. Loading/empty states. |
| 7 | A-2.10 | Buffer: performance + PR reviews | Various | Test HomeScreen scroll performance with 100+ products. Virtualize long lists. Review Dev B, C, D PRs. |

**End of Week 2 Deliverable:** HomeScreen complete. Search works. Category browsing works. AllProducts dynamic.

---

## Week 3 — Checkout Flow (Critical Path)

| Day | Task ID | Task | Files | Acceptance Criteria |
|-----|---------|------|-------|---------------------|
| 1 | A-3.1 | Build CheckoutScreen — address section | `src/screens/customer/CheckoutScreen.tsx` | Form: delivery address (TextInput, multiline), contact phone (TextInput, numeric). Both required. Validation via Zod: address min 10 chars, phone min 10 digits. Pre-fill from user profile if available. |
| 1 | A-3.2 | Build delivery option selector | `src/screens/customer/CheckoutScreen.tsx` (continue) | Radio list of delivery options from cart items' available options. Each shows: type (e.g. "Express"), duration (e.g. "1-2 days"), fee (GHS). Selected option highlighted with primary color border. |
| 2 | A-3.3 | Build order summary section | `src/screens/customer/CheckoutScreen.tsx` (continue) | ScrollView sections: items list (image + name + qty + price), subtotal, delivery fee, coupon discount (if applied), total in bold. "Place Order" button at bottom (sticky). |
| 2 | A-3.4 | Build create order API module | `src/api/orders.ts` | `createOrder(data: CreateOrderDto) → Promise<Order>`. `CreateOrderDto`: `{ items: {productId, quantity}[], address, contact, deliveryOptionId, paymentMethod, couponCode? }`. |
| 3 | A-3.5 | Build order creation hook | `src/hooks/useOrders.ts` | `useCreateOrder()`: TanStack Query mutation. On success → navigate to PaymentScreen with order ID + total. On error → show error message below form. Invalidates cart query on success. |
| 3 | A-3.6 | Build PaymentScreen — Paystack initialization | `src/screens/customer/PaymentScreen.tsx` | Receives params: `orderId`, `totalAmount`. Calls `POST /payments/initialize` with order reference + amount + email. Receives `authorization_url`. |
| 4 | A-3.7 | Wire checkout navigation flow | `src/screens/customer/CheckoutScreen.tsx` (wire), `src/screens/customer/PaymentScreen.tsx` (wire) | Cart → Checkout → Payment. Pass cart items + total as route params. On back from Payment before completion → warn dialog ("Cancel payment?"). |
| 5 | A-3.8 | Checkout validation (Zod schemas) | `src/utils/validation.ts` | `checkoutSchema`: zod.object with address (min 10), contact (min 10 digits, starts with 0), deliveryOptionId (required), paymentMethod (enum: 'card' | 'mobile_money'). |
| 6 | A-3.9 | End-to-end purchase flow testing | — | Full flow: browse product → add to cart → go to cart → checkout → pay → success. Test with empty cart. Test with invalid coupon. Test network failure at each step. Test back button at each step. |
| 7 | A-3.10 | Buffer: checkout edge cases | Various | Loading states on every button. Disabled buttons during API calls. Coupon removal. Changing delivery option recalculates total. Address validation. |

**End of Week 3 Deliverable:** Complete purchase flow. Checkout → Payment → Order confirmed. Critical path unblocked.

---

## Week 4 — Settings, Polish & Ship

| Day | Task ID | Task | Files | Acceptance Criteria |
|-----|---------|------|-------|---------------------|
| 1 | A-4.1 | Build Vendor Settings — shop profile | `src/screens/vendor/SettingsScreen.tsx` | Form pre-filled with current shop data: name, description, logo (image picker), location, contact, delivery range (numeric). Save button → PATCH vendor profile. Success toast. |
| 1 | A-4.2 | Build logout functionality | `src/screens/vendor/SettingsScreen.tsx` (continue) | Logout button at bottom (red). Confirm dialog: "Are you sure you want to logout?". On confirm → `authStore.logout()` → clear secure storage → navigate to Launch. |
| 2 | A-4.3 | Loading states audit — all screens | All screens owned by Dev A | Every screen: loading skeleton/spinner while data fetches. No flash of empty content. Skeleton matches layout shape. |
| 2 | A-4.4 | Error states audit — all screens | All screens owned by Dev A | Every API call: error message displayed (not raw error). Retry button where applicable. Network error → "No internet connection" with retry. |
| 3 | A-4.5 | Safe area audit | All screens | Test on iPhone 15 Pro (dynamic island), iPhone SE (no notch), Pixel 8 (punch hole). Verify: content not hidden behind notch/island, bottom tabs not covered by home indicator, keyboard doesn't obscure inputs. |
| 4 | A-4.6 | App icon + splash screen | `assets/icon.png`, `assets/splash.png`, `app.json` | App icon: BexieMart logo on primary blue background. Splash: white background with centered logo. Exported at all required sizes via `expo-splash-screen`. |
| 5 | A-4.7 | Bug fixes from device testing | Various | Fix all bugs reported by Dev B, C, D from real device testing. |
| 6 | A-4.8 | iOS build for TestFlight | — | `eas build --platform ios --profile production`. Resolve any build errors. Upload to App Store Connect. Submit for TestFlight review. |
| 7 | A-4.9 | Submit to App Store Connect | — | Complete App Store listing: description, keywords, screenshots (from Dev B), support URL, privacy policy URL. Submit for review. |

**End of Week 4 Deliverable:** Both apps submitted for review. Project shipped.

---

## Dev A — API Modules Owned

| Module | File | Endpoints | Used By |
|--------|------|-----------|---------|
| Client | `src/api/client.ts` | Base Axios instance | Everyone |
| Auth | `src/api/auth.ts` | POST login, POST register, POST forgot-password, POST reset-password, GET me | Dev A, B |
| Products | `src/api/products.ts` | GET products (search, list, detail), GET categories | Dev A, B |
| Orders | `src/api/orders.ts` | POST orders (create), GET orders (list, detail), PATCH status | Dev A, D |

## Dev A — Hooks Owned

| Hook | File | Query/Mutation | Used By |
|------|------|---------------|---------|
| `useLogin` | `src/hooks/useAuth.ts` | Mutation | Dev B |
| `useRegister` | `src/hooks/useAuth.ts` | Mutation | Dev B |
| `useLogout` | `src/hooks/useAuth.ts` | Mutation | Everyone |
| `useCurrentUser` | `src/hooks/useAuth.ts` | Query | Everyone |
| `useCategories` | `src/hooks/useProducts.ts` | Query | Dev A |
| `useTopProducts` | `src/hooks/useProducts.ts` | Query | Dev A |
| `useSearchProducts` | `src/hooks/useProducts.ts` | Query | Dev A |
| `useCreateOrder` | `src/hooks/useOrders.ts` | Mutation | Dev A |

## Dev A — Stores Owned

| Store | File | State Shape |
|-------|------|-------------|
| Auth | `src/stores/authStore.ts` | `{ user, accessToken, refreshToken, isAuthenticated, isLoading }` |

## Dev A — Components Owned

| Component | File | Dependencies |
|-----------|------|-------------|
| SearchBar | `src/components/ui/SearchBar.tsx` | `expo-image`, `useSearchProducts` |
| CategoryCard | `src/components/product/CategoryCard.tsx` | `expo-image` |
| TopProductsList | `src/components/product/TopProductsList.tsx` | `ProductCard` |
| Carousel | `src/components/ui/Carousel.tsx` | `FlatList` (horizontal, pagingEnabled) |

## Dev A — Screens Owned

| Screen | File | Tab/Stack |
|--------|------|-----------|
| LaunchScreen | `src/screens/auth/LaunchScreen.tsx` | Auth Stack |
| LoginScreen | `src/screens/auth/LoginScreen.tsx` | Auth Stack |
| RegisterScreen | `src/screens/auth/RegisterScreen.tsx` | Auth Stack |
| ForgotPasswordScreen | `src/screens/auth/ForgotPasswordScreen.tsx` | Auth Stack |
| PasswordVerifyScreen | `src/screens/auth/PasswordVerifyScreen.tsx` | Auth Stack |
| NewPasswordScreen | `src/screens/auth/NewPasswordScreen.tsx` | Auth Stack |
| HomeScreen | `src/screens/customer/HomeScreen.tsx` | Customer Tab 1 |
| AllProductsScreen | `src/screens/customer/AllProductsScreen.tsx` | Customer Stack |
| CheckoutScreen | `src/screens/customer/CheckoutScreen.tsx` | Customer Stack |
| SettingsScreen | `src/screens/vendor/SettingsScreen.tsx` | Vendor Tab 5 |

---

## Daily Standup Notes Template

```
Dev A — Day X
✅ Done yesterday: [list]
🚧 Doing today: [list]
⛔ Blockers: [list or "none"]
📞 Need from: [Dev B/C/D — specific ask]
```

---

_Generated from BexieMart PRD v1.0. April 27, 2026._
