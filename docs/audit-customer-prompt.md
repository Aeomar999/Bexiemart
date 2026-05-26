# Bexiemart — Customer-Side Button Audit & Fix

**Goal:** Audit EVERY `onPress` / tap handler across all 33 customer-facing screens. For each button, determine what it SHOULD do based on its label, icon, and page context, verify it DOES that, and fix any mismatch. If a button needs a subpage that doesn't exist, create it. Every button MUST do exactly what it was created for.

---

## Scope

33 files under `apps/mobile/app/(customer)/`:

```
(customer)/
├── (tabs)/
│   ├── (home)/index          → Home dashboard
│   ├── (shop)/index          → Product grid, filters
│   ├── cart                  → Cart items, coupon, checkout
│   └── profile               → Profile hub (links to all subpages)
├── product/[id]              → Product detail, gallery, reviews
├── checkout                  → Delivery + payment form
├── payment                   → Processing animation, receipt
├── search                    → Search bar, results
├── notifications             → Notification list
├── orders                    → Order history
├── favorites/index           → Saved items grid
├── addresses                 → Address list
├── referrals                 → Referral code, share
├── review-modal              → Star rating + comment
├── flash-sales               → Timed deals
├── track-order               → Rider map, status timeline
├── chat                      → Vendor messaging
├── contact                   → Email/phone/WhatsApp cards
├── help                      → FAQ accordion
└── wallet/                   → 7 subpages (index, topup, transfer, request, rewards, transactions, transaction/[id])
```

---

## Button Classification

Every interactive element (`TouchableOpacity`, `Pressable`, `<Button>`, `<Text onPress>`) falls into one of these categories. For each, determine its INTENDED purpose and verify implementation.

### 1. Navigation Buttons (router.push/router.back)
- **Back buttons** — should `router.back()`. Verify it's present.
- **Menu/list items** (e.g., "My Wallet", "Order History") — should `router.push(targetRoute)`. Verify route exists on disk.
- **"See All" / "View All"** — should navigate to the full list page.
- **Tab bar items** — should switch tabs.
- **Action → Detail** (e.g., product card, order card) — should push to the detail page with correct ID.

### 2. Action Buttons
- **Add to Cart** — should call `useCartStore.addItem()`, show visual feedback. Verify store function exists and is called correctly.
- **Favorite / Unfavorite** — should call `useFavoritesStore.toggleFavorite()`. Verify icon updates.
- **Remove Item** — should call `removeItem()` with confirmation dialog.
- **Apply Coupon** — should validate code, apply discount, show result.
- **Place Order** — should validate form → navigate to payment screen.
- **Top Up / Send / Request** — form submits → success screen → navigate back.
- **Share / Copy** — should trigger native share sheet or clipboard API.
- **Submit Review** — should validate rating, then navigate back.

### 3. State Toggles
- **Dark Mode toggle** — switches local state (theme implementation may be future).
- **Show/Hide balance** — toggles visibility of wallet amount.
- **Read More / Show Less** — toggles text truncation.

### 4. Placeholder / Dead Buttons
- **No `onPress` at all** — must BE FIXED by adding a handler.
- **`onPress={() => {}}`** — must BE FIXED with real handler or user feedback (Toast).
- **`console.log(...)` only** — must BE FIXED with Toast or real action.
- **`route: "#"` in config** — must show Toast: "Coming soon" instead of doing nothing.

---

## Per-Button Decision Tree

For EVERY button found, follow this process:

```
Step 1: Identify the button and its context.
  - What page is it on?
  - What is the label / icon / position?
  - What does a user expect it to do?

Step 2: Read the current onPress handler.
  - Does an onPress prop exist? If not → it's DEAD, fix immediately.
  - What does it do? Navigate? Call store? Toggle state? Nothing?

Step 3: Determine what it SHOULD do.
  - If it's labeled "Add to Cart" → it should add to cart and show feedback.
  - If it's a product card → it should navigate to product/[id].
  - If it's a back arrow → it should call router.back().
  - If it's a settings option → navigate to the relevant subpage.

Step 4: Does current behavior match intended behavior?
  - YES → Done, report as ✅.
  - NO → Fix it:
    a. Write the correct onPress handler.
    b. If it needs a subpage that doesn't exist, CREATE the subpage file.
    c. If it calls a store function that doesn't exist, ADD it to the store.
    d. If it should show user feedback and doesn't, add Toast.show().

Step 5: Verify the fix compiles.
  - Run `npx expo export --platform web` — must pass with 0 errors.
```

---

## Route Map (which page to push for each button)

| Button Label / Context | Should Navigate To |
|------------------------|-------------------|
| Product card | `/(customer)/product/{id}` |
| "Checkout" | `/(customer)/checkout` |
| "Pay" / "Place Order" | `/(customer)/payment` with params |
| "View Orders" | `/(customer)/orders` |
| "Continue Shopping" | `/(customer)/(shop)` |
| "My Wallet" | `/(customer)/wallet` |
| "Top Up" | `/(customer)/wallet/topup` |
| "Send" / "Transfer" | `/(customer)/wallet/transfer` |
| "Request" | `/(customer)/wallet/request` |
| "Rewards" | `/(customer)/wallet/rewards` |
| "Transactions" / "View All" | `/(customer)/wallet/transactions` |
| Wallet transaction row | `/(customer)/wallet/transaction/{id}` |
| "Order History" | `/(customer)/orders` |
| Order card (active) | `/(customer)/track-order` |
| "My Collections" / Favorites | `/(customer)/favorites` |
| "Delivery Addresses" | `/(customer)/addresses` |
| "Notifications" | `/(customer)/notifications` |
| "Help Center" | `/(customer)/help` |
| "Contact Us" | `/(customer)/contact` |
| "Refer & Earn" | `/(customer)/referrals` |
| "Track Order" | `/(customer)/track-order` |
| "Chat" / "Message" | `/(customer)/chat` |
| "Write a Review" | `/(customer)/review-modal` |
| "Browse Products" / "Start Shopping" | `/(customer)/(shop)` |
| "Flash Sale" banner | `/(customer)/flash-sales` |
| Back arrow | `router.back()` |
| Search bar (Home) | `/(customer)/search` |
| Bell icon | `/(customer)/notifications` |
| Menu / hamburger | `/(customer)/profile` |
| "Visit Store" | `/(customer)/(shop)` |

---

## Button Inventory Template

For each file, produce this output:

```
## [File Path]
| # | Element | Label/Icon | Line | What It Should Do | Current Behavior | Status | Fix Applied |
|---|---------|------------|------|-------------------|-----------------|--------|-------------|
| 1 | Pressable | "Add to Cart" | 322 | addItem to cart-store + visual feedback | ✅ Calls addItem, shows "Added" state for 2s | ✅ Pass | — |
| 2 | Pressable | Share icon | 115 | Open native share sheet with product link | ❌ No onPress handler | ❌ FAIL | Added onPress placeholder |
```

---

## Store API Reference (for context)

**useCartStore**: `addItem`, `updateQuantity`, `removeItem`, `clearCart`, `items`, `itemCount`, `subtotal`
**useFavoritesStore**: `toggleFavorite`, `isFavorite`, `favorites`
**useWalletStore**: `topUp`, `sendMoney`, `addTransaction`, `spendBexieCoins`, `balance`, `transactions`, `bexieCoins`
**useAuthStore**: `user`, `logout`, `isAuthenticated`
**useProductStore**: `products`, `categories`, `activeCategoryFilter`, `searchQuery`, `setActiveCategoryFilter`, `setSearchQuery`

---

## Non-Navigation Button Behaviors

| Button | Store Function | Feedback | Notes |
|--------|---------------|----------|-------|
| Add to Cart | `useCartStore.addItem()` | Toast "Added to Cart" + icon flash | Also update quantity selector |
| Favorite (heart) | `useFavoritesStore.toggleFavorite()` | Toast "Added to/Removed from Favorites" | Toggle filled/outline heart icon |
| Remove from Cart | `useCartStore.removeItem()` | Alert.alert confirmation, then Toast | |
| Coupon Apply | Local state `couponApplied` | Toast success/error | Validate code "BEXIE10" |
| Log Out | `useAuthStore.logout()` + `router.replace("/")` | No toast needed | |
| Share | `Share.share()` from react-native | No feedback needed | |
| Copy code | `Clipboard.setStringAsync()` from expo-clipboard | Toast "Copied!" | |
| Dark Mode | Local useState toggle | No feedback needed | Future: persist to store |
| "Try Again" (payment) | Reset stage to "processing" | No feedback | |

---

## Final Verdict

After fixing all buttons, the output must end with:

```
## Summary
- Total buttons found: XX
- Working correctly: XX
- Fixed (was broken): XX
- Created new subpages: XX
- Bundle compile: ✅ / ❌
- Overall: PASS / MINOR ISSUES / FAIL
```
