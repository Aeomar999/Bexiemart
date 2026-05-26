# BexieMart E2E Payment Testing Guide

## Prerequisites

1. **Backend running**: `npm run server` (requires PostgreSQL + .env configured)
2. **Expo dev server**: `npm start` → press `a` for Android or `i` for iOS
3. **Paystack test account**: Sign up at https://dashboard.paystack.com

## Test Cards

| Card Number | Result | Use Case |
|-------------|--------|----------|
| `4084084084084081` | ✅ Success | Normal payment flow |
| `4100000000000018` | 🔐 Auth required | OTP verification flow |
| `4100000000000000` | ❌ Insufficient funds | Payment failure flow |
| `4100000000000026` | ❌ Expired card | Card validation failure |

**OTP for auth-required**: `12345`

## Full E2E Test Sequence

### 1. Success Flow
```
1. Open app → Browse products
2. Add 2+ items to cart
3. Go to cart → Review items
4. Tap "Checkout"
5. Fill delivery address:
   - Name: Test User
   - Phone: +2348012345678
   - Address: 123 Test Street, Lagos
   - City: Lagos
   - State: Lagos
6. Select delivery option
7. Review order total
8. Tap "Pay Now"
9. Enter test card: 4084084084084081
10. Expiry: 12/30, CVV: 123
11. Submit payment
12. ✅ Verify: Redirected to PaymentSuccessScreen
13. ✅ Verify: Cart is empty
14. ✅ Verify: Order appears in Orders tab
```

### 2. Failure Flow
```
1-8. Same as above
9. Enter test card: 4100000000000000
10. ❌ Payment should fail
11. ✅ Verify: Redirected to PaymentFailureScreen
12. ✅ Verify: "Retry Payment" button works
13. ✅ Verify: Order remains in "pending" status
```

### 3. Auth/OTP Flow
```
1-8. Same as above
9. Enter test card: 4100000000000018
10. When prompted for OTP, enter: 12345
11. ✅ Verify: Payment completes
12. ✅ Verify: Redirected to PaymentSuccessScreen
```

## Vendor Flow Test

### Create Product → Receive Order
```
1. Sign in as vendor
2. Go to Products tab → Add Product
3. Upload image (Cloudinary upload)
4. Fill product details
5. Add delivery options
6. Create product
7. ✅ Verify: Product appears in product list
8. Switch to customer account
9. Find and purchase the new product
10. Switch back to vendor account
11. ✅ Verify: New order appears in Orders tab
12. ✅ Verify: Stats updated on Dashboard
```

## Known Issues & Workarounds

| Issue | Workaround |
|-------|-----------|
| CORS errors on web preview | Use native (Android/iOS) build, not web |
| Paystack WebView blank | Ensure `react-native-webview` is installed |
| Session not persisting | Check SecureStore is working on device |
| Images not uploading | Verify Cloudinary credentials in .env |

## Automated Testing (Future)

For automated E2E testing, consider:
- **Detox**: React Native e2e testing framework
- **Maestro**: Cross-platform mobile testing
- **Playwright**: Web-only testing (Expo web)
