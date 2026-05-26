# Bexiemart Customer App: Complete UX & Technical Audit

This document provides a comprehensive audit of the entire `app/(customer)` directory. It highlights what is currently broken or statically mocked, proposes UX improvements, and outlines a roadmap for bringing the app to a production-ready state.

> [!WARNING]
> **State of the App:** Outside of the recently completed `Wallet` and a functional `Cart` store, the vast majority of the customer app relies on static mock data (`MOCK_PRODUCTS`, `FEATURED_HIGHLIGHTS`, etc.). Most screens lack real state management, data persistence, and API integration.

---

## 1. Screen-by-Screen Breakdown

### 📱 1.1 Home Screen (`(tabs)/(home)/index.tsx`)
**Current State:** Fully static mock data.
- 🔴 **Broken/Missing Routes:** 
  - The hero banner ("Holiday Deals Are Live!") does not route anywhere.
  - "Filter Pills" (Instant Delivery, Featured Meals) have no `onPress` functionality.
  - "Featured Highlights" and "Quick Actions" (Order Food, Track Order) are static buttons.
  - "Top Products", "New Items", and "Just For You" lists do not link to the product details screen.
- 🟡 **UX Improvements needed:**
  - Add Skeleton loaders for when data is fetched.
  - The "Flash Sale" timer is hardcoded (`00:35:58`). It needs a real `setInterval` hook.
  - "See All" buttons next to section headers do not work.

### 🛍️ 1.2 Shop Screen (`(tabs)/(shop)/index.tsx`)
**Current State:** Functional UI but uses an array of 20 `MOCK_PRODUCTS`.
- 🟢 **Working:** Filtering (Categories, Search) and Sorting (Popular, Price) work well on the mock array. Add to Cart works via Zustand.
- 🟡 **UX Improvements needed:**
  - The "Favorites" heart toggle works in local state but wipes on reload. Needs a `useFavoritesStore` with async storage.
  - No pagination or infinite scroll (FlatList `onEndReached` is not implemented).

### 🛒 1.3 Cart & Checkout (`cart.tsx`, `checkout.tsx`)
**Current State:** Cart manages state via `useCartStore`, but Checkout is mostly a UI shell.
- 🔴 **Broken/Missing:**
  - `checkout.tsx`: The "Place Order" button works, but doesn't actually clear the cart, generate an order ID, or hit a payment gateway.
  - `checkout.tsx`: Applying BexieCoins uses a hardcoded `Alert.alert` mockup instead of actually reading from the `useWalletStore`.
  - Coupon codes in `cart.tsx` throw a mocked `Alert.alert("Invalid", ...)`.
- 🟡 **UX Improvements needed:**
  - Add a swipe-to-delete gesture on cart items using `react-native-reanimated`.
  - Add address validation and real-time shipping cost calculation on the checkout screen.

### 👤 1.4 Profile & Settings (`profile.tsx`)
**Current State:** UI layout is complete, but deeply nested screens are missing.
- 🔴 **Broken/Missing Routes:**
  - "Payment Methods", "Language", "Help Center", and "Contact Us" map to `route: "#"` and do nothing when tapped.
  - "Log Out" button has no functionality.
- 🟡 **UX Improvements needed:**
  - Dark Mode toggle flips a local state variable but doesn't actually trigger a theme change across the app. Need a global theme provider.
  - Allow users to edit their profile picture and name.

### 📦 1.5 Orders & Tracking (`orders.tsx`, `track-order.tsx`)
**Current State:** UI components exist but lack state.
- 🔴 **Broken/Missing:**
  - `orders.tsx` has hardcoded "Active" and "Past" tabs with static data.
  - `track-order.tsx` shows a static Google Maps placeholder and a hardcoded timeline (e.g., "Order Placed", "In Transit").
- 💡 **New Features:**
  - Real-time map tracking with the Rider app.
  - QR Code generation for order pickup verification.

---

## 2. Global UX & UI Improvements

> [!TIP]
> **To achieve "God-Tier" UI status as mandated by the design rules, we must implement the following globally:**

1. **Micro-interactions:** Add `activeOpacity={0.7}` to ALL touchables. Implement slight scaling animations (press down effects) on main buttons.
2. **Haptic Feedback:** Integrate `expo-haptics`. Trigger light haptics on Tab presses, Add to Cart, and Switch toggles. Trigger success haptics on Checkout and Wallet Transfers.
3. **Empty States:** Ensure every `FlatList` has a beautifully illustrated `ListEmptyComponent` (like we did for Transactions).
4. **Toast Notifications:** Replace jarring `Alert.alert` calls with in-app toast notifications (e.g., `react-native-toast-message`) for actions like "Added to Cart" or "Address Saved".
5. **Image Loading:** Use `expo-image` with `blurhash` placeholders instead of standard `<Image />` for faster loading and no layout shift.

---

## 3. Recommended Roadmap & New Features

To move this from a frontend template to a functional application, I recommend the following execution plan:

### Phase 1: Global State & Navigation Fixes
- [ ] Implement `useAuthStore` to manage User state and handle the "Log Out" action.
- [ ] Implement `useProductStore` to replace `MOCK_PRODUCTS` across the Home and Shop screens.
- [ ] Fix all dead links on the Home screen to properly push to `/(customer)/product/[id]`.
- [ ] Wire up the Home screen's Category pills to link to the Shop screen with pre-applied filters.

### Phase 2: Interconnected Features
- [ ] **Favorites:** Build `useFavoritesStore` so liked items persist across the Shop, Product Details, and Profile -> Collections screens.
- [ ] **Wallet Integration:** Connect the Checkout screen directly to `useWalletStore`. Allow users to pay for orders using their wallet balance or BexieCoins.
- [ ] **Cart Sync:** Ensure `checkout.tsx` actually reads from `useCartStore`, calculates totals dynamically, and clears the cart on success.

### Phase 3: Advanced UX Features
- [ ] Replace `Alert.alert` with a custom Toast notification system.
- [ ] Add swipe-to-delete on Cart and Notifications.
- [ ] Build a functioning countdown hook for the Flash Sales timer.
- [ ] Implement the missing generic pages (Help Center, Contact Us, Settings).

---

## Open Questions for You

> [!IMPORTANT]
> How would you like to proceed?
> 1. Do you want me to start immediately on **Phase 1** (Global State and linking the Home screen)?
> 2. Would you rather I focus on connecting the **Checkout flow to the Wallet** we just built?
> 3. Or should I focus strictly on upgrading the **UI/UX** (Haptics, Toasts, Animations) across the current screens?
