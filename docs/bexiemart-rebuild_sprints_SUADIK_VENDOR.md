# Sprint Plan — Suadik: Vendor Experience Lead

**Role:** Frontend Developer — Seller Experience  
**Domains:** Vendor Dashboard, Products CRUD, Image Upload, Vendor Orders UI, Earnings UI, Settings UI, Scaffold Navigation  
**Dependencies:** Blocked by Dev A until Day 3 (navigation + API client + types)  
**Key Deliverables:** VendorTabs navigator, DashboardScreen, ProductsScreen, AddEditProductScreen, OrdersScreen (UI), OrderDetailsScreen (UI), EarningsScreen (UI), SettingsScreen (UI), StatsCard component, ProductGrid component, image upload flow

---

## Week 1 — Prep, Types & Scaffold

### Day 1: Environment & Research

| Task ID | Task | Effort | Acceptance Criteria |
|---------|------|--------|---------------------|
| D-1.1 | Set up dev environment | 2h | Expo CLI installed. Project cloned. `npx expo start` runs. iOS + Android simulators working. |
| D-1.2 | Study backend Prisma schema — vendor models | 2h | Deep understanding of: `Vendor` (id, userId, status, shopId), `Shop` (name, description, location, contact, deliveryRange, logo), `Product` (all fields + relations), `Order` (all fields + OrderItem + status flow), `Earning` (totalAmount, pendingCommission, totalWithdrawn), `Coupon`. |
| D-1.3 | Map Prisma types to TypeScript interfaces | 1h | Cross-reference Prisma schema with Dev A's `src/types/index.ts`. Note any missing types: `VendorShop`, `VendorStats`, `VendorEarning`. Flag to Dev A. |
| D-1.4 | Screenshot all Flutter vendor screens | 1.5h | Screenshots of: Vendor Dashboard, Products List, Add Product, Edit Product, Orders List, Order Details, Earnings, Settings, Add Coupon. Save to `reference/flutter-screenshots/vendor/`. |
| D-1.5 | Study Flutter vendor UI patterns | 1h | Note: card-based stats, list items with image + status badge, form layout (single column, full width), bottom sheet for add/edit, color-coded order statuses. |

**End of Day 1 Deliverable:** Backend models understood. Design reference documented.

---

### Day 2: API Response Types & Navigation Prep

| Task ID | Task | Files | Effort | Acceptance Criteria |
|---------|------|-------|--------|---------------------|
| D-2.1 | Complete TypeScript types for vendor domain | `src/types/index.ts` (contribute) | 2h | Define: `VendorShop { id, name, description, location, contact, deliveryRange, logo, createdAt }`. `VendorStats { totalProducts, totalOrders, totalEarnings, pendingOrders }`. `VendorEarning { totalAmount, pendingCommission, totalWithdrawn, transactions: EarningTransaction[] }`. `EarningTransaction { id, amount, type, orderRef, date }`. `VendorOrder { id, status, totalPrice, items: OrderItem[], customerName, customerPhone, address, paymentStatus, createdAt }`. |
| D-2.2 | Define product form types | `src/types/index.ts` (contribute) | 1h | `CreateProductDto { name, description, price, discountAmount?, discountType?, quantity, color?, categoryId, images: string[], deliveryOptions: DeliveryOptionInput[] }`. `UpdateProductDto` (all fields optional). `DeliveryOptionInput { type, fee, duration, unit }`. |
| D-2.3 | Scaffold CustomerTabs placeholder tabs | `src/navigation/CustomerTabs.tsx` (contribute) | 1h | Add tabs 3, 4, 5 as placeholder views. Tab 3: "Food" (coming soon), Tab 4: "Earn" (coming soon), Tab 5: "Wallet" (coming soon). Each shows EmptyState with appropriate title. |
| D-2.4 | Scaffold VendorTabs navigator structure | `src/navigation/VendorTabs.tsx` (build initially, hand off to Dev A) | 2h | 5 tabs: Dashboard, Products, Orders, Earnings, Settings. Each tab has its own native stack navigator (for push screens). Icons match Flutter: Dashboard (`Icons.dashboard`), Products (`Icons.shopping_bag`), Orders (`Icons.receipt`), Earnings (`Icons.monetization_on`), Settings (`Icons.settings`). AppBar: "BexieMart" title (Raleway 24px bold), profile image (cached, circular), notification bell with badge. Active tab color: `#004CFF`, inactive: `#686262`. |
| D-2.5 | Build StatsCard component | `src/components/vendor/StatsCard.tsx` | 1h | Props: `title: string`, `value: string | number`, `icon: ReactNode`, `color?: string`. Visual: card (white bg, borderRadius 12, shadow). Icon in colored circle (top-left). Title (Nunito 14px, textSecondary). Value (Raleway 20px bold, textPrimary). 2 cards per row in a flexWrap container. |

**End of Day 2 Deliverable:** Types complete. Navigation scaffolded. StatsCard built.

---

### Day 3: ProductCard & ProductGrid Components

| Task ID | Task | Files | Effort | Acceptance Criteria |
|---------|------|-------|--------|---------------------|
| D-3.1 | Build ProductCard component | `src/components/product/ProductCard.tsx` | 3h | **Default variant (grid):** Image (expo-image, aspect 1:1, borderRadius 8 top). Name (Nunito 14px medium, max 2 lines). Price (Nunito 16px bold, primary color). Discount badge (red pill top-left, only if discount). Favorite icon (heart, top-right). Rating (star + number, only if >0). OnPress → ProductDetails. **Compact variant (horizontal list):** Image (80×80), name + price in column, height ~100. |
| D-3.2 | Test ProductCard with all states | — | 30m | Test: with discount (badge visible), without discount (no badge), with rating, without rating (no star), out of stock (overlay), long name (clamped to 2 lines). Both variants. |
| D-3.3 | Build ProductGrid component | `src/components/product/ProductGrid.tsx` | 2h | Props: `products: Product[]`, `onProductPress`, `onEndReached?`, `loading?: boolean`, `emptyMessage?: string`. Renders FlatList with 2 columns. `numColumns={2}`. `columnWrapperStyle` for gap. `ListEmptyComponent`: EmptyState if not loading. `ListFooterComponent`: LoadingSpinner if loading more. Pull-to-refresh support. |
| D-3.4 | Build vendor API module | `src/api/vendor.ts` | 1.5h | `getVendorStats() → Promise<VendorStats>`, `getVendorProducts() → Promise<Product[]>`, `createProduct(data: CreateProductDto) → Promise<Product>`, `updateProduct(id, data: UpdateProductDto) → Promise<Product>`, `deleteProduct(id) → Promise<void>`, `getVendorOrders(status?) → Promise<VendorOrder[]>`, `getVendorOrderDetail(id) → Promise<VendorOrder>`, `updateOrderStatus(id, status) → Promise<void>`, `getVendorEarnings() → Promise<VendorEarning>`, `withdrawEarnings(amount, destination) → Promise<void>`, `updateShopProfile(data) → Promise<Shop>`. |

**End of Day 3 Deliverable:** ProductCard, ProductGrid, vendor API module ready.

---

### Day 4-5: Vendor Dashboard

| Task ID | Task | Files | Effort | Acceptance Criteria |
|---------|------|-------|--------|---------------------|
| D-4.1 | Build DashboardScreen | `src/screens/vendor/DashboardScreen.tsx` | 4h | **Stats row (2×2 grid):** Total Products (icon: shopping_bag, value from API), Total Orders (icon: receipt, value from API), Total Earnings (icon: monetization_on, value in GHS), Pending Orders (icon: pending, value). Each is a StatsCard. Loading: skeleton cards (grey rectangles). Error: per-card error with retry. **Recent Orders section:** Heading "Recent Orders" (Raleway 20px bold) + "See All" link. FlatList of last 5 orders. Each item: order ID, date, status badge, total. Tap → OrderDetails. Empty: "No orders yet" EmptyState. |
| D-4.2 | Wire DashboardScreen to API | `src/screens/vendor/DashboardScreen.tsx` (wire) | 1h | `useQuery` for vendor stats. `useQuery` for recent orders (limit 5). Pull-to-refresh refreshes both. Loading skeleton while fetching. Error state with retry per section. |
| D-4.3 | Build vendor hooks | `src/hooks/useVendor.ts` | 2h | `useVendorStats()`: TanStack Query, staleTime 60s. `useVendorProducts()`: TanStack Query, staleTime 30s. `useCreateProduct()`: Mutation, invalidates products query. `useUpdateProduct()`: Mutation, invalidates products query. `useDeleteProduct()`: Mutation, confirm before call, invalidates products query. |
| D-4.4 | Test DashboardScreen | — | 1h | Test: stats load correctly from API. Recent orders display. Tap order → navigates (placeholder for now). Pull-to-refresh. Empty state when vendor has no orders (new account). |

**End of Day 4-5 Deliverable:** Vendor dashboard functional with live data.

---

### Day 6-7: Vendor Products List + Shop/Home Prep

| Task ID | Task | Files | Effort | Acceptance Criteria |
|---------|------|-------|--------|---------------------|
| D-6.1 | Build ProductsScreen — product list | `src/screens/vendor/ProductsScreen.tsx` | 3h | FlatList of vendor's products. Each item: ProductCard (compact variant, showing image, name, price, stock status). FAB (floating action button) with "+" icon → AddEditProduct (create mode). Pull-to-refresh. Empty state: "No products yet. Add your first product!" with "Add Product" button. |
| D-6.2 | Add stock status indicator to ProductCard | `src/components/product/ProductCard.tsx` (expand) | 1h | Vendor variant: shows stock count + status. "In Stock" (green, qty > 0) or "Out of Stock" (red, qty = 0). Active/Inactive status badge (from product.status field). |
| D-6.3 | Test ProductsScreen | — | 1h | Test: products load from API. FAB navigates to AddEditProduct. ProductCard tap → EditProduct. Pull-to-refresh. Empty state. |
| D-6.4 | Start HomeScreen scaffolding (coordinate with Dev A) | `src/screens/customer/HomeScreen.tsx` (scaffold) | 2h | Create basic ScrollView structure. Add section placeholders: SearchBar (will be Dev A's component), Carousel (Dev A), Categories (Dev A), Top Products (Dev A). Coordinate with Dev A who owns the actual sections — Dev D provides the screen shell. |
| D-6.5 | Wire category API test | `src/screens/customer/ShopScreen.tsx` (scaffold) | 1h | Test `GET /products/categories` response. Verify category data matches expected shape. Scaffold basic ShopScreen with category filter chips. Dev B will complete in Week 2. |

**End of Week 1 Milestone:** ✅ VendorTabs navigator functional. ProductCard, ProductGrid, StatsCard built. Dashboard + Products list screens working with API. Home screen scaffolded.

---

## Week 2 — Vendor Products CRUD

| Day | Task ID | Task | Files | Acceptance Criteria |
|-----|---------|------|-------|---------------------|
| 1 | D-2.1 | Build AddEditProductScreen — basic fields | `src/screens/vendor/AddEditProductScreen.tsx` | ScrollView form. Mode: `create` (empty) or `edit` (pre-filled). Fields: product name (FormInput, required), description (FormInput, multiline, 3 lines), category (dropdown/picker from API categories), price (FormInput, numeric, required, GHS prefix), discount type (none / percentage / fixed — radio buttons), discount amount (FormInput, numeric, only shown if discount type selected), quantity (FormInput, numeric, required), color (FormInput, optional). |
| 2 | D-2.2 | Build AddEditProductScreen — images | `src/screens/vendor/AddEditProductScreen.tsx` (continue) | "Product Images" section. Multi-image picker using `expo-image-picker`. Grid of selected images (3 columns). Each image: thumbnail with "x" remove button. "Add Image" placeholder tile. Max 5 images. Upload to Cloudinary on form submit, not on selection. |
| 3 | D-2.3 | Build AddEditProductScreen — delivery options | `src/screens/vendor/AddEditProductScreen.tsx` (continue) | "Delivery Options" section. "Add Delivery Option" button → opens inline form: type (TextInput), fee (numeric, GHS), duration (numeric), unit (picker: hours/days). Added options shown as cards with remove. Max 3 options. |
| 4 | D-2.4 | Build image upload to Cloudinary | `src/utils/upload.ts` | Function: `uploadImage(uri: string) → Promise<string>`. Uses `fetch` with FormData. Uploads to Cloudinary upload endpoint. Returns secure_url. Progress callback. Error handling: retry once, then show error. Images compressed (quality 80%, max 1200px) before upload. |
| 4 | D-2.5 | Wire product form to API | `src/screens/vendor/AddEditProductScreen.tsx` (wire) | Zod schema: `productSchema`. On submit: if new → `useCreateProduct()`, if edit → `useUpdateProduct()`. Images uploaded first (show progress), then product created with returned URLs. Loading state on submit button. Success → navigate back to ProductsScreen with toast. Error → show below form. |
| 5 | D-2.6 | Edit product — pre-fill form | `src/screens/vendor/AddEditProductScreen.tsx` (continue) | On edit mode: fetch product by ID. Pre-fill all fields. Show existing images (loaded from Cloudinary URLs). Form changes tracked — "Discard changes?" dialog on back if dirty. |
| 6 | D-2.7 | Delete product | `src/screens/vendor/ProductsScreen.tsx` (add) | Long-press or swipe on product → "Delete" option. Confirm dialog: "Delete [product name]? This action cannot be undone." On confirm → `useDeleteProduct()` mutation. Item removed from list with animation. |
| 7 | D-2.8 | Product CRUD end-to-end testing | — | Test: Add product → appears in list → tap → pre-filled edit form → change price → save → price updated in list. Delete product → confirm → removed from list. Add product with images → images appear in product details. Test all form validations: empty required fields, negative price, invalid image. |

**End of Week 2 Deliverable:** Full product CRUD working. Image upload → Cloudinary. Form validation complete.

---

## Week 3 — Vendor Orders + Dashboard Detail

| Day | Task ID | Task | Files | Acceptance Criteria |
|-----|---------|------|-------|---------------------|
| 1 | D-3.1 | Wire vendor dashboard to real stats | `src/screens/vendor/DashboardScreen.tsx` (wire) | Replace any placeholder data with API responses. Stats cards show real `totalProducts`, `totalOrders`, `totalEarnings`, `pendingOrders`. Recent orders show real order data. Tap order → navigate to OrderDetails. |
| 2 | D-3.2 | Vendor orders — filter tabs | `src/screens/vendor/OrdersScreen.tsx` | FlatList with sticky filter bar. Tabs: All, Pending, Confirmed, Processing, Shipped, Delivered, Cancelled. Each tab queries API with `?status=X`. Selected tab: primary color underline + bold text. Order item: order ID (#), date, customer name, item count, total, status badge. Tap → OrderDetails. |
| 2 | D-3.3 | Build OrderStatusBadge component | `src/components/vendor/OrderStatusBadge.tsx` | Props: `status: OrderStatus`. Badge colors: pending (#F59E0B), confirmed (#004CFF), processing (#FF9800), shipped (#9C27B0), delivered (#08A81D), cancelled (#B3261E). Rounded pill. White text. Size: fits content + 8px padding. |
| 3 | D-3.4 | Build OrderDetailsScreen UI | `src/screens/vendor/OrderDetailsScreen.tsx` | Sections: ① Order header: ID + date + status badge. ② Items: list of products (image 60×60, name, qty, unit price, subtotal). ③ Customer: name, phone (tap to call), address. ④ Payment: method (card/momo), status, total amount. ⑤ Delivery: option name, fee, address. ⑥ Status update: buttons for next valid status (e.g., Pending → Confirm, Confirmed → Process). Grayed out invalid transitions. |
| 4 | D-3.5 | Wire order status update | `src/screens/vendor/OrderDetailsScreen.tsx` (wire) | Status buttons call `useUpdateOrderStatus()` mutation. Optimistic update: button shows spinner, status badge updates immediately, rollback on API error. Confirmation dialog for irreversible actions (cancelling order). Success toast. |
| 5 | D-3.6 | Vendor earnings screen — UI | `src/screens/vendor/EarningsScreen.tsx` | Stats cards row: Total Earned (green), Pending Commission (orange), Total Withdrawn (blue). Below: transaction history FlatList. Each row: date, description ("Order #1234" or "Withdrawal"), amount (+ green for credits, - red for debits). |
| 5 | D-3.7 | Wire earnings to API | `src/screens/vendor/EarningsScreen.tsx` (wire) | `useVendorEarnings()` query. Pull-to-refresh. Skeleton loading. Error with retry. |
| 6 | D-3.8 | Withdrawal flow | `src/screens/vendor/EarningsScreen.tsx` (continue) | "Withdraw" button (top-right). Bottom sheet: amount input (numeric, max = available balance). Destination: bank account (shows saved account) or mobile money (shows saved number). "Confirm Withdrawal" button. Success → show receipt (amount, destination, reference, date). Error → show reason. |
| 7 | D-3.9 | Integration testing — vendor flows | — | Full vendor lifecycle: dashboard loads → add product → product appears in list → customer orders → order appears in vendor orders → view details → confirm order → process → ship → mark delivered → earnings updated. Withdrawal: earnings → withdraw → balance decreases. Cross-role: customer order creates vendor order. |

**End of Week 3 Deliverable:** Full vendor management. Dashboard, orders with status management, earnings with withdrawal.

---

## Week 4 — Settings, Stretch & Ship

| Day | Task ID | Task | Files | Acceptance Criteria |
|-----|---------|------|-------|---------------------|
| 1 | D-4.1 | Empty states sweep — all vendor screens | All vendor screens | ProductsScreen: "No products yet" with "Add Product" CTA. OrdersScreen: "No orders yet" with shop link. EarningsScreen: "No earnings yet" with info text. DashboardScreen: "Welcome! Start by adding products" if 0 products. |
| 2 | D-4.2 | Keyboard handling | All vendor screens with forms | AddEditProductScreen: `KeyboardAvoidingView` with `behavior="padding"`. ScrollView scrolls to focused field. "Done" button on keyboard for non-multiline fields. Form doesn't get hidden behind keyboard. |
| 3 | D-4.3 | **Stretch Goal — Food Tab** | `src/screens/customer/FoodScreen.tsx` | CustomerTabs tab 3. ProductGrid filtered to food category (`category.name === 'food'` or similar). Delivery time indicator on each card. Filter chips: "All", "15-30 min", "30-60 min", "1hr+". |
| 4 | D-4.4 | **Stretch Goal — Wallet Tab** | `src/screens/customer/WalletScreen.tsx` | CustomerTabs tab 5. Wallet balance in GHS (prominent, large text). "Add Funds" button (placeholder for v1.1). Transaction history: list of credits/debits. Uses wallet API (`GET /wallet`). |
| 5 | D-4.5 | Bug fixes from device testing | Various | Fix all bugs reported by Dev B, C from real device testing. Focus on vendor screens. |
| 6 | D-4.6 | Final regression testing | — | Run through handoff checklist. Test full vendor flow on both platforms. Test all form validations. Test image upload on slow network. Test withdrawal edge cases (amount > balance, network failure). |
| 7 | D-4.7 | Documentation + handoff notes | `sprints/docs/handoff.md` | Document: vendor screen architecture, API endpoints used, known limitations (e.g., "coupon management moved to v1.1"), Cloudinary upload configuration, form validation rules, order status flow diagram. |

**End of Week 4 Deliverable:** All vendor screens polished. Stretch goals completed if time allowed. Documentation ready.

---

## Dev D — Components Owned

| Component | File | Status |
|-----------|------|--------|
| StatsCard | `src/components/vendor/StatsCard.tsx` | Vendor dashboard |
| ProductCard | `src/components/product/ProductCard.tsx` | Used everywhere (co-built) |
| ProductGrid | `src/components/product/ProductGrid.tsx` | Used in Shop, AllProducts, Products, Favorites |

## Dev D — Screens Owned

| Screen | File | Route |
|--------|------|-------|
| DashboardScreen | `src/screens/vendor/DashboardScreen.tsx` | Vendor Tab 1 |
| ProductsScreen | `src/screens/vendor/ProductsScreen.tsx` | Vendor Tab 2 |
| AddEditProductScreen | `src/screens/vendor/AddEditProductScreen.tsx` | Vendor Stack |
| OrdersScreen | `src/screens/vendor/OrdersScreen.tsx` | Vendor Tab 3 |
| OrderDetailsScreen | `src/screens/vendor/OrderDetailsScreen.tsx` | Vendor Stack |
| EarningsScreen | `src/screens/vendor/EarningsScreen.tsx` | Vendor Tab 4 |
| SettingsScreen | `src/screens/vendor/SettingsScreen.tsx` | Vendor Tab 5 |
| FoodScreen *(stretch)* | `src/screens/customer/FoodScreen.tsx` | Customer Tab 3 |
| WalletScreen *(stretch)* | `src/screens/customer/WalletScreen.tsx` | Customer Tab 5 |

## Dev D — API Modules Owned

| Module | File | Endpoints |
|--------|------|-----------|
| Vendor | `src/api/vendor.ts` | GET stats, GET/POST/PUT/DELETE products, GET orders, GET order detail, PATCH order status, GET earnings, POST withdraw, PATCH shop profile |
| Wallet *(stretch)* | `src/api/wallet.ts` | GET wallet, GET transactions |

## Dev D — Hooks Owned

| Hook | File | Query/Mutation |
|------|------|---------------|
| `useVendorStats` | `src/hooks/useVendor.ts` | Query |
| `useVendorProducts` | `src/hooks/useVendor.ts` | Query |
| `useCreateProduct` | `src/hooks/useVendor.ts` | Mutation |
| `useUpdateProduct` | `src/hooks/useVendor.ts` | Mutation |
| `useDeleteProduct` | `src/hooks/useVendor.ts` | Mutation |
| `useVendorOrders` | `src/hooks/useVendor.ts` | Query |
| `useVendorOrderDetail` | `src/hooks/useVendor.ts` | Query |
| `useUpdateOrderStatus` | `src/hooks/useVendor.ts` | Mutation |
| `useVendorEarnings` | `src/hooks/useVendor.ts` | Query |
| `useWithdraw` | `src/hooks/useVendor.ts` | Mutation |
| `useUpdateShop` | `src/hooks/useVendor.ts` | Mutation |

---

## Daily Standup Notes Template

```
Dev D — Day X
✅ Done yesterday: [list]
🚧 Doing today: [list]
⛔ Blockers: [list or "none"]
📞 Need from: [Dev A/B/C — specific ask]
```

---

_Generated from BexieMart PRD v1.0. April 27, 2026._
