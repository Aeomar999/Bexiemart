# Sprint Plan — Jerry: Cart & Payments Lead

**Role:** Frontend Developer — Purchase Flow  
**Domains:** Cart, Checkout UI, Paystack Integration, Payment Success/Failure  
**Dependencies:** Blocked by Dev A until Day 3 (navigation + API client + types). Depends on Dev B's ProductCard + ProductDetails in Week 2 for cart integration.  
**Key Deliverables:** CartScreen, PaymentScreen, PaymentSuccessScreen, PaymentFailureScreen, CartStore, Cart API hooks, Paystack WebView wrapper

---

## Week 1 — Setup, Components & Prep

### Day 1: Environment & Research

| Task ID | Task | Effort | Acceptance Criteria |
|---------|------|--------|---------------------|
| C-1.1 | Set up dev environment | 2h | Expo CLI installed. Project cloned. `npx expo start` runs. iOS + Android simulators working. |
| C-1.2 | Study Paystack API documentation | 2h | Understand: initialize transaction (`POST /transaction/initialize`), verify transaction (`GET /transaction/verify/:reference`), WebView callback handling (`onNavigationStateChange`), test keys vs live keys. Document callback URL pattern. |
| C-1.3 | Screenshot all Flutter cart + payment screens | 1h | Screenshots of: Cart (with items, empty), Checkout, Payment Processing, Payment Success, Payment Failure. Save to `reference/flutter-screenshots/cart-payment/`. |
| C-1.4 | Study Prisma schema for cart, order, payment models | 1h | Understand: Cart ↔ Consumer relationship, Cart → Product relationship, Order → OrderItem relationship, Payment model. Note required fields for creating orders. |
| C-1.5 | Study react-native-webview API | 1h | Understand: `source={{ uri }}`, `onNavigationStateChange`, `onMessage` (postMessage from WebView), `injectedJavaScript`. Paystack uses `onNavigationStateChange` to detect callback. |

**End of Day 1 Deliverable:** Paystack flow understood. Design reference ready. Prisma models mapped.

---

### Day 2: UI Components

| Task ID | Task | Files to Create | Effort | Acceptance Criteria |
|---------|------|----------------|--------|---------------------|
| C-2.1 | Build Button component (shared) | `src/components/ui/Button.tsx` | 2h | Props: `title: string`, `onPress: () => void`, `loading?: boolean`, `variant: 'primary' | 'outline' | 'danger'`,`disabled?: boolean`,`style?: ViewStyle`. Visual:`variant=primary` → `#004CFF` bg, white text, 50px height, borderRadius 25. `variant=outline` → white bg, `#004CFF` border (1px), `#004CFF` text. `variant=danger` → `#B3261E` bg, white text. Loading state: ActivityIndicator replaces title. Disabled: opacity 0.5. Touch target ≥44px. Used by all team members — must be first component built. |
| C-2.2 | Build FormInput component (shared) | `src/components/ui/FormInput.tsx` | 2h | Props: `label: string`, `placeholder: string`, `value: string`, `onChangeText`, `error?: string`, `secureTextEntry?: boolean`, `keyboardType?`, `suffixIcon?: ReactNode`, `onSuffixPress?`, `editable?`. Visual: label above (Nunito 14px, textSecondary), input field (border `#E4E7EC`, borderRadius 8, height 50, padding 12), error text below (Nunito 12px, error color). Focused border → primary color. |
| C-2.3 | Build LoadingSpinner component (shared) | `src/components/ui/LoadingSpinner.tsx` | 30m | Props: `size?: 'small' | 'large'`,`color?: string`,`fullScreen?: boolean`. Fullscreen variant: centered, semi-transparent background. |
| C-2.4 | Build EmptyState component (shared) | `src/components/ui/EmptyState.tsx` | 1h | Props: `image: ImageSourcePropType`, `title: string`, `subtitle?: string`, `actionLabel?: string`, `onAction?: () => void`. Visual: centered column. Image (200×200). Title (Raleway 18px bold). Subtitle (Nunito 14px). Optional Button below. Used for: empty cart, empty favorites, no search results, no orders. |
| C-2.5 | Build Badge component (shared) | `src/components/ui/Badge.tsx` | 30m | Props: `count: number`, `color?: string`. Visual: small red circle with white number. Hidden if `count <= 0`. Position: absolute top-right of parent icon. |
| C-2.6 | Build Card component (shared) | `src/components/ui/Card.tsx` | 1h | Props: `children`, `onPress?`, `elevation?: number`. Visual: white bg, borderRadius 12, shadow (iOS: shadowColor/offset/opacity/radius, Android: elevation). Padding 12. |

**End of Day 2 Deliverable:** All shared UI components built. Ready for team use.

---

### Day 3-4: Component Library Polish + Cart Store

| Task ID | Task | Files | Effort | Acceptance Criteria |
|---------|------|-------|--------|---------------------|
| C-3.1 | FormInput polish — password visibility toggle | `src/components/ui/FormInput.tsx` (expand) | 1h | When `secureTextEntry=true`, show eye/eye-off icon as suffix. Tap toggles visibility. Icon matches Flutter's `visibility` / `visibility_off`. |
| C-3.2 | FormInput polish — error state animation | `src/components/ui/FormInput.tsx` (expand) | 30m | Error text fades in. Input border changes to error color on error. Shake animation on submit if invalid. |
| C-3.3 | Component library documentation | `reference/component-library.md` | 2h | Document each component: props table, usage examples, visual preview (screenshot or ASCII), which screens use it. |
| C-3.4 | Build cart store (Zustand) | `src/stores/cartStore.ts` | 2h | State: `items: CartItem[]`, `itemCount: number` (computed), `subtotal: number` (computed). Actions: `addItem(product, quantity)`, `removeItem(productId)`, `updateQuantity(productId, quantity)`, `clearCart()`, `applyCoupon(code, discount)`, `removeCoupon()`. Syncs to API cart on every mutation. Optimistic updates. |
| C-3.5 | Build cart API module | `src/api/cart.ts` | 1h | `getCart() → Promise<Cart>`, `addToCart(productId, quantity) → Promise<void>`, `updateCartItem(cartItemId, quantity) → Promise<void>`, `removeFromCart(cartItemId) → Promise<void>`. |
| C-3.6 | Build cart hooks (TanStack Query) | `src/hooks/useCart.ts` | 2h | `useCart()`: query → GET /cart. `useAddToCart()`: mutation → POST /cart, invalidates cart query, updates cartStore optimistically. `useUpdateCartItem()`: mutation → PUT /cart/:id. `useRemoveFromCart()`: mutation → DELETE /cart/:id. All with optimistic updates. Error rollback on API failure. |

**End of Day 3-4 Deliverable:** Component library complete and documented. Cart state management ready.

---

### Day 5-6: Additional Components

| Task ID | Task | Files | Effort | Acceptance Criteria |
|---------|------|-------|--------|---------------------|
| C-5.1 | Build Carousel component (shared) | `src/components/ui/Carousel.tsx` | 2h | Props: `items: {image: string, onPress?: () => void}[]`, `autoPlay?: boolean`, `interval?: number`. Uses FlatList horizontal with `pagingEnabled`. Dot indicators below. Auto-scrolls if `autoPlay=true`. |
| C-5.2 | Build CartItem component | `src/components/cart/CartItem.tsx` | 2h | Product image (80×80, expo-image), name (Nunito 14px medium), price per unit (Nunito 14px), quantity selector: - button / number / + button (min 1, max stock), subtotal (qty × price, bold). Swipe-to-delete or "x" remove button. |
| C-5.3 | Build CartSummary component | `src/components/cart/CartSummary.tsx` | 1.5h | Subtotal, delivery fee ("Calculated at checkout" for now), coupon discount (if applied), total (Raleway 18px bold). Coupon input field with "Apply" button. Applied coupon shows code + discount with "Remove" option. |
| C-5.4 | Component accessibility audit | `src/components/ui/` (all) | 1.5h | All buttons: `accessibilityLabel` + `accessibilityHint`. FormInput: `accessibilityLabel` = label text. Badge: `accessibilityLabel` = "X items in cart". Touch targets confirmed ≥44×44. |

**End of Day 5-6 Deliverable:** Cart components built. Shared components accessible.

---

### Day 7: Buffer & Week 2 Prep

| Task ID | Task | Effort | Acceptance Criteria |
|---------|------|--------|---------------------|
| C-7.1 | Review Dev A's API client PR | 1h | Verify token refresh logic. Test that cart API calls go through the client correctly. |
| C-7.2 | Study Flutter CartScreen for UI reference | 1h | Map Flutter cart layout to React Native components. Identify: CartItem equivalent, CartSummary equivalent, empty state. |
| C-7.3 | Plan CartScreen state machine | 1h | Document states: loading (skeleton), empty (EmptyState), has items (CartItem list + CartSummary), error (retry), checking out (navigating away). |
| C-7.4 | Prepare Week 2 test Paystack keys | 30m | Get test public key from Paystack dashboard. Store in `src/utils/constants.ts` as `PAYSTACK_PUBLIC_KEY`. |
| C-7.5 | Review react-native-webview + Paystack integration examples | 2h | Find working examples of `react-native-webview` with Paystack inline. Understand: URL to load, how to detect callback, how to verify payment, edge case handling (user closes WebView, network failure, timeout). |

**End of Week 1 Milestone:** ✅ Component library complete and documented. Cart state management ready. Paystack integration understood.

---

## Week 2 — Cart Screen

| Day | Task ID | Task | Files | Acceptance Criteria |
|-----|---------|------|-------|---------------------|
| 1 | C-2.1 | Build CartScreen — UI | `src/screens/customer/CartScreen.tsx` | ScrollView: header "My Cart" (Raleway 24px bold). CartItem list (FlatList). CartSummary at bottom. "Checkout" Button (sticky bottom, primary, full width). Empty state (EmptyState component). |
| 1 | C-2.2 | Wire cart to API | `src/screens/customer/CartScreen.tsx` (wire) | `useCart()` fetches on mount. CartItems render from API data. Quantity + / - calls `useUpdateCartItem()`. Remove calls `useRemoveFromCart()` with confirm dialog. |
| 2 | C-2.3 | Cart item quantity enforcement | `src/components/cart/CartItem.tsx` (expand) | "+" disabled when quantity = stock. "-" disabled when quantity = 1. Stock from product data. Show "Only X left" if stock ≤ 5. |
| 2 | C-2.4 | Coupon input + validation | `src/components/cart/CartSummary.tsx` (expand) | TextInput for coupon code. "Apply" button. Validates via API (`POST /coupons/validate`). Shows discount amount on success. Shows error ("Invalid coupon code", "Coupon expired") on failure. Applied coupon: green text showing discount, "Remove" link. |
| 3 | C-2.5 | Cart badge on tab bar | `src/components/ui/Badge.tsx` (wire to cartStore) | Badge component reads `cartStore.itemCount`. Updates on every cart mutation (optimistic). Show on Cart icon in CustomerTabs AppBar. |
| 4 | C-2.6 | CartScreen — loading state | `src/screens/customer/CartScreen.tsx` (add) | Skeleton: 3 grey rectangles mimicking CartItem layout. CartSummary skeleton with lines for prices. |
| 4 | C-2.7 | CartScreen — error state | `src/screens/customer/CartScreen.tsx` (add) | Error message + "Retry" button. Uses `useCart().error`. |
| 5 | C-2.8 | CartScreen — empty state | `src/screens/customer/CartScreen.tsx` (add) | EmptyState component: shopping cart illustration, "Your cart is empty", "Start Shopping" button → navigate to Shop tab. |
| 6 | C-2.9 | Cross-screen cart sync testing | — | Test: ProductDetails → Add to Cart → navigate to Cart → item appears. ProductDetails → Add to Cart → Add same item again → quantity increases. Cart → change qty → leave screen → come back → qty persists. Cart → remove item → item gone from list. Cart → add item → badge updates on tab bar. |
| 7 | C-2.10 | Buffer: cart edge cases | — | Test: adding out-of-stock item (should be prevented). Rapid +/- tapping (debounce). Network failure during add/update/remove (rollback to previous state). Empty cart → add item → verify empty state gone. |

**End of Week 2 Deliverable:** Cart fully functional. Add, remove, update quantity, coupon, badge count. All states handled.

---

## Week 3 — Payments (Critical Path)

| Day | Task ID | Task | Files | Acceptance Criteria |
|-----|---------|------|-------|---------------------|
| 1 | C-3.1 | Build Paystack WebView wrapper | `src/screens/customer/PaymentScreen.tsx` | Receives `authorization_url` from checkout. WebView loads Paystack payment page. `onNavigationStateChange` detects callback URL pattern (`/callback` or `reference=`). Parse reference from URL. Call verify API. Show success/failure based on verification. Loading overlay while WebView loads. Close/cancel button in header. |
| 1 | C-3.2 | Build payment API module | `src/api/payments.ts` | `initializePayment(orderId, amount, email) → Promise<{authorization_url, reference}>`. `verifyPayment(reference) → Promise<{status, amount, orderId}>`. |
| 2 | C-3.3 | Build PaymentProcessingScreen | `src/screens/customer/PaymentProcessingScreen.tsx` | Full-screen overlay. Animated spinner (Lottie or ActivityIndicator). "Processing your payment..." text (Nunito 16px). "Please don't close the app". Automatically dismisses on payment completion. |
| 3 | C-3.4 | Build PaymentSuccessScreen | `src/screens/customer/PaymentSuccessScreen.tsx` | Green checkmark animation. "Payment Successful!" (Raleway 24px bold). Order ID, amount paid, payment method. "View Order" button → order details (placeholder or navigate). "Continue Shopping" button → Shop tab. |
| 3 | C-3.5 | Build PaymentFailureScreen | `src/screens/customer/PaymentFailureScreen.tsx` | Red X icon. "Payment Failed" heading. Error reason from API. "Try Again" button → back to payment. "Choose Another Method" → back to checkout. "Cancel Order" → back to Home. |
| 4 | C-3.6 | Payment failure edge cases | `src/screens/customer/PaymentScreen.tsx` (expand) | WebView fails to load → error with retry. WebView timeout (60s) → timeout message + retry. User presses back during WebView → confirm dialog ("Cancel payment?"). App backgrounded during payment → resume where left off. Network drops during verification → retry verification. |
| 5 | C-3.7 | Payment WebView polish | `src/screens/customer/PaymentScreen.tsx` (expand) | Loading bar at top of WebView. Back button in header. URL bar showing `paystack.com` (read-only, for trust). Test with Paystack test cards: success card, failure card, 3DS card. |
| 6 | C-3.8 | Payment flow end-to-end testing | — | Full flow: Cart → Checkout (Dev A) → Payment → WebView → pay with test card → verification → success screen. Test: wrong CVV → error. Insufficient funds → error. Close WebView mid-payment. Kill app during payment → reopen → verify order status. |
| 7 | C-3.9 | Payment error handling sweep | `src/screens/customer/PaymentScreen.tsx`, `PaymentSuccessScreen.tsx`, `PaymentFailureScreen.tsx` | All possible error states: network error, timeout, invalid card, insufficient funds, bank declined, Paystack API down, verification timeout. Each with user-friendly message + actionable next step. |

**End of Week 3 Deliverable:** Payment flow complete. Paystack integration works in test mode. All error states handled.

---

## Week 4 — Polish & Ship

| Day | Task ID | Task | Files | Acceptance Criteria |
|-----|---------|------|-------|---------------------|
| 1 | C-4.1 | Error handling sweep — all screens | All owned screens | Every API call in cart and payment screens: error message displayed, retry button, no raw errors. |
| 2 | C-4.2 | Pull-to-refresh — all list screens | CartScreen | CartScreen: pull-to-refresh syncs with server cart. Shows RefreshControl with primary color spinner. |
| 2 | C-4.3 | CartScreen performance | CartScreen | Test with 20+ cart items. Verify FlatList virtualization. Smooth scroll. No re-render flicker on quantity change. |
| 3 | C-4.4 | Image optimization | All components using expo-image | Use Cloudinary URL transforms: `w_400,h_400,c_fill,q_auto:good` appended to image URLs. Product thumbnails: 200×200. Product details: 800×800. |
| 4 | C-4.5 | Build and test on real Android device | — | Install on Android phone. Test: cart operations, payment flow (test mode). Check: safe area, keyboard behavior, back button handling. |
| 5 | C-4.6 | Play Store screenshots | — | Capture screenshots for Google Play: phone screenshots (various sizes), feature graphic (1024×500). |
| 6 | C-4.7 | Android build for Internal Testing | — | `eas build --platform android --profile production`. Test AAB on real device. Upload to Play Console Internal Testing. |
| 7 | C-4.8 | Post-submission monitoring | — | Monitor Play Console for pre-launch report issues. Fix any crashes found. Respond to TestFlight feedback (via Dev A). |

**End of Week 4 Deliverable:** Both builds submitted. Payment flow production-ready.

---

## Dev C — Components Owned

| Component | File | Status |
|-----------|------|--------|
| Button | `src/components/ui/Button.tsx` | Shared — all devs use |
| FormInput | `src/components/ui/FormInput.tsx` | Shared — all devs use |
| LoadingSpinner | `src/components/ui/LoadingSpinner.tsx` | Shared — all devs use |
| EmptyState | `src/components/ui/EmptyState.tsx` | Shared — all devs use |
| Badge | `src/components/ui/Badge.tsx` | Shared — used in CustomerTabs |
| Card | `src/components/ui/Card.tsx` | Shared — all devs use |
| Carousel | `src/components/ui/Carousel.tsx` | Shared — used in HomeScreen, ProductDetails |
| CartItem | `src/components/cart/CartItem.tsx` | Used in CartScreen |
| CartSummary | `src/components/cart/CartSummary.tsx` | Used in CartScreen |

## Dev C — Screens Owned

| Screen | File | Route |
|--------|------|-------|
| CartScreen | `src/screens/customer/CartScreen.tsx` | Customer Stack |
| PaymentScreen | `src/screens/customer/PaymentScreen.tsx` | Customer Stack |
| PaymentProcessingScreen | `src/screens/customer/PaymentProcessingScreen.tsx` | Customer Stack |
| PaymentSuccessScreen | `src/screens/customer/PaymentSuccessScreen.tsx` | Customer Stack |
| PaymentFailureScreen | `src/screens/customer/PaymentFailureScreen.tsx` | Customer Stack |

## Dev C — Stores Owned

| Store | File | State Shape |
|-------|------|-------------|
| Cart | `src/stores/cartStore.ts` | `{ items: CartItem[], itemCount: number, subtotal: number, coupon?: {code, discount} }` |

## Dev C — API Modules Owned

| Module | File | Endpoints |
|--------|------|-----------|
| Cart | `src/api/cart.ts` | GET /cart, POST /cart, PUT /cart/:id, DELETE /cart/:id |
| Payments | `src/api/payments.ts` | POST /payments/initialize, GET /payments/verify/:reference |
| Coupons | `src/api/cart.ts` (add) | POST /coupons/validate |

## Dev C — Hooks Owned

| Hook | File | Query/Mutation |
|------|------|---------------|
| `useCart` | `src/hooks/useCart.ts` | Query |
| `useAddToCart` | `src/hooks/useCart.ts` | Mutation |
| `useUpdateCartItem` | `src/hooks/useCart.ts` | Mutation |
| `useRemoveFromCart` | `src/hooks/useCart.ts` | Mutation |
| `useInitializePayment` | `src/hooks/useOrders.ts` (add) | Mutation |
| `useVerifyPayment` | `src/hooks/useOrders.ts` (add) | Query |
| `useValidateCoupon` | `src/hooks/useCart.ts` (add) | Mutation |

---

## Daily Standup Notes Template

```
Dev C — Day X
✅ Done yesterday: [list]
🚧 Doing today: [list]
⛔ Blockers: [list or "none"]
📞 Need from: [Dev A/B/D — specific ask]
```

---

_Generated from BexieMart PRD v1.0. April 27, 2026._
