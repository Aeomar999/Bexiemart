# BEXIEMART — NON-TECHNICAL PRODUCTION READINESS REPORT

**Date:** July 20, 2026 | **Version:** Pre-Production Audit | **Classification:** Internal

---

## 1. Executive Summary

Bexiemart is a **campus-focused e-commerce marketplace** designed for the Ghanaian market. It enables customers to shop from local vendors, order food from restaurants, book services, and hire delivery dispatchers — all from a single mobile app. The platform supports four user roles: **Customer, Vendor, Dispatcher, and Admin**.

The platform is **technically mature** with ~95% of planned features built. The core commerce loop (browse → cart → checkout → payment → delivery → review) is fully functional. The payment system supports Ghana's primary digital payment methods: mobile money (MTN, Vodafone, AirtelTigo), bank transfers, and card payments via Paystack.

**The platform is NOT yet production-ready** due to three critical blockers: email delivery infrastructure, maps API provisioning, and exposed secrets. All three are fixable within 1-2 days of focused work.

---

## 2. What Bexiemart Is

### The Problem
Campus students and young professionals in Ghana struggle to discover and shop from local vendors, order food, book services, and get deliveries — all in one place. Existing solutions are fragmented: Jumia for electronics, Bolt for rides, WhatsApp for vendor communication.

### The Solution
Bexiemart is a **single mobile app** that combines:
- **Marketplace** — browse and buy from multiple campus vendors
- **Food ordering** — order from local restaurants
- **Service booking** — book haircuts, repairs, and other services
- **Delivery dispatch** — hire riders for parcel and order delivery
- **Digital wallet** — top up, transfer, and pay with your phone
- **Social commerce** — watch reels, view stories, follow vendors

### Target Market
Ghanaian university campuses and surrounding communities. Primary payment method: Mobile Money (MoMo).

---

## 3. User Roles & Capabilities

### Customers
- Browse and search products from multiple vendors
- Add to cart, checkout with card, MoMo, bank transfer, or wallet
- Track deliveries in real-time on a live map
- Order food from restaurants with a separate food cart
- Book vendor services (haircuts, repairs, etc.)
- Watch social reels and stories from vendors
- Use a digital wallet with top-up, transfer, and withdrawal
- Earn loyalty points (BexieCoins) on purchases
- Refer friends and earn rewards
- Chat with vendors and support
- Submit support tickets

### Vendors
- Create a shop with logo, banner, and business hours
- List products with multiple images
- Manage food items and restaurant profile
- List services with pricing and availability
- Manage orders and update status
- Track earnings with analytics
- Hire and manage staff with permission controls
- Create coupons and promotions
- Respond to customer reviews
- Create social content (reels and stories)
- Upload verification documents

### Dispatchers (Riders)
- View available delivery tasks on a map
- Accept tasks and navigate to pickup/dropoff
- Update delivery status through the workflow
- Share real-time location with customers
- Track earnings and withdraw funds
- View performance analytics

### Admins
- View platform dashboard (revenue, orders, users, vendors)
- Manage users (ban/unban, role changes)
- Approve or suspend vendors
- Manage dispatcher fleet
- Oversee orders and resolve disputes
- Create flash sales, banners, and coupons
- Moderate content (reels, reviews)
- Configure platform settings (commission rates, delivery pricing)
- Manage admin team (super-admin only)
- Export CSV reports

---

## 4. Business Model & Revenue

### Revenue Streams

| Stream | How It Works | Current Default |
|--------|-------------|-----------------|
| **Platform Commission** | Percentage deducted from each vendor sale | 5% per order |
| **Delivery Fees** | Dynamic pricing based on distance, vehicle type, and demand | Base fare + per-km + per-minute |
| **Withdrawal Fees** | Small fee when vendors/dispatchers withdraw funds | Configurable |
| **Promotional Fees** | Vendors pay for featured placement (banners, flash sales) | TBD |

### Payment Methods Supported

| Method | Provider | Coverage |
|--------|----------|----------|
| MTN Mobile Money | Paystack | Ghana-wide |
| Vodafone Mobile Money | Paystack | Ghana-wide |
| AirtelTigo Money | Paystack | Ghana-wide |
| Debit/Credit Card | Paystack | Visa, Mastercard |
| Bank Transfer | Paystack | All Ghana banks |
| Wallet Balance | Internal | Bexiemart users |
| BexieCoins (Loyalty) | Internal | Earned on purchases |

### Escrow System
- When a customer pays, funds are held in escrow per vendor
- Platform commission is deducted automatically
- Vendor receives payout after delivery confirmation
- Admin can intervene for disputes (refund or release)

---

## 5. Feature Summary by User Role

### Customer Journey
1. **Discover** → Browse home screen with categories, banners, flash sales
2. **Search** → Find products by name, category, or vendor
3. **Cart** → Add items from multiple vendors
4. **Checkout** → Select delivery address, payment method, apply coupons
5. **Pay** → Pay with card, MoMo, bank, or wallet
6. **Track** → Real-time delivery tracking on a live map
7. **Receive** → Confirm delivery, rate product/vendor
8. **Engage** → Watch reels, follow vendors, earn BexieCoins

### Vendor Journey
1. **Onboard** → Create shop, upload documents, set business hours
2. **List** → Add products with images, pricing, descriptions
3. **Receive Orders** → Get notified of new orders
4. **Fulfill** → Process and ship orders
5. **Get Paid** → Earnings credited to wallet after escrow release
6. **Grow** → Create promotions, manage staff, respond to reviews

### Dispatcher Journey
1. **Go Online** → Toggle availability status
2. **Browse Tasks** → View available deliveries on a map
3. **Accept** → Pick up a task and navigate to pickup
4. **Deliver** → Update status through pickup → dropoff workflow
5. **Get Paid** → Earnings credited to wallet

---

## 6. Platform Highlights

### Competitive Advantages
- **All-in-one**: Marketplace + food + services + delivery in one app
- **Campus-first**: Designed for the campus community
- **Ghana-native**: MoMo support, GHS currency, local delivery
- **Social commerce**: Reels, stories, vendor follows drive engagement
- **Digital wallet**: P2P transfers, loyalty points, instant withdrawals
- **Real-time tracking**: Live map with driver location during delivery
- **Multi-vendor escrow**: Buyer protection with automatic commission handling

### Technical Quality Indicators
- **57 database models** — comprehensive data architecture
- **180+ API endpoints** — full-featured backend
- **30+ admin dashboard pages** — complete platform management
- **4 role-based experiences** — customer, vendor, dispatcher, admin
- **Real-time messaging** — chat with typing indicators and read receipts
- **3 WebSocket namespaces** — chat, delivery tracking, admin events
- **Enterprise security** — 2FA, SSRF protection, input sanitization, rate limiting
- **Monitoring** — Sentry error tracking, PostHog analytics, structured logging

---

## 7. What's NOT Ready (Blockers)

### Blocker 1: Email Delivery Broken
**Severity: CRITICAL**

The platform sends emails via SMTP (Titan Mail), but **Railway blocks SMTP ports**. This means:
- Users **cannot receive** email verification links
- Users **cannot receive** password reset emails
- Users **cannot receive** order confirmation emails

**What works:** SMS-based OTP via Arkesel still works for login verification. But all other transactional emails are broken.

**Fix:** Switch to Resend (an email API that works over HTTPS, which Railway does NOT block). Estimated effort: 1 day.

### Blocker 2: Maps API Not Provisioned
**Severity: CRITICAL**

The Google Maps API key is not configured for production. This means:
- Delivery pricing uses **estimated distances** (not real road distances)
- Customers **cannot see the actual route** on the map during tracking
- **Address search** (geocoding) doesn't work
- **ETA estimates** are unreliable guesses

**What works:** A basic Haversine fallback provides rough distance estimates. The UI still displays maps with pickup/dropoff markers.

**Fix:** Provision a Google Maps Platform API key. Estimated effort: 30 minutes + ~$200/month for usage.

### Blocker 3: Secrets Exposed
**Severity: CRITICAL**

Environment files containing API keys, database passwords, and service credentials exist in the repository and may have been committed to git history. This includes:
- Database connection string with password
- Paystack API keys
- Google OAuth credentials
- Cloudinary API secret
- SMTP password
- Sentry and PostHog API keys

**What this means:** Anyone with access to the repository history can access the database, impersonate the platform on Paystack, or abuse other services.

**Fix:** Rotate all credentials immediately, purge `.env` files from git history, and use Railway's environment variables for production config. Estimated effort: 2 hours.

---

## 8. What's NOT Ready (Important but Not Blocking)

### No CI/CD Pipeline
Tests exist but must be run manually. No automated testing before deployment. Breaking changes can reach production without detection.

### Admin App Untested
The admin dashboard has only 2 test files across 48+ source files. Bugs in the admin panel could cause financial errors, incorrect vendor approvals, or missed disputes.

### No Load Testing
No evidence of stress testing. Unknown how the platform performs under load (flash sales, peak ordering hours, concurrent deliveries).

### Push Notifications Not Sending
The mobile app registers push tokens, but no server-side push notification sending service was found. Users won't receive proactive notifications about orders, messages, or promotions.

### No Privacy Policy / Terms of Service
Required for app store submission and legal compliance. Not found in the repository.

### No App Store Preparation
No screenshots, descriptions, or store listings prepared for Google Play or Apple App Store submission.

---

## 9. Market Readiness Assessment

| Aspect | Status | Notes |
|--------|--------|-------|
| Product-market fit | STRONG | Campus e-commerce + delivery + food + services is a clear gap |
| Payment readiness | READY | All Ghana payment methods supported via Paystack |
| User experience | GOOD | Polished UI with error handling, loading states, offline support |
| Admin capabilities | GOOD | Full platform management dashboard |
| Revenue model | DEFINED | Commission + delivery fees + wallet fees |
| Market localization | STRONG | Ghana-focused: MoMo, GHS, local delivery, campus community |
| Email/communication | BROKEN | Email delivery fails on Railway |
| Maps/location | DEGRADED | Works but inaccurate without API key |
| Legal compliance | MISSING | No privacy policy, no terms of service |
| App store readiness | NOT STARTED | No store listings, screenshots, or metadata |
| Customer support | READY | In-app ticket system with categories, priority, and rating |

---

## 10. Competitive Landscape

| Feature | Bexiemart | Jumia | Bolt Food | WhatsApp Vendors |
|---------|-----------|-------|-----------|-----------------|
| Multi-vendor marketplace | YES | YES | NO | INFORMAL |
| Food ordering | YES | YES | YES | INFORMAL |
| Service booking | YES | NO | NO | INFORMAL |
| Delivery dispatch | YES | YES (JumiaPay) | YES | SELF-PICKUP |
| Digital wallet | YES | NO | YES (Bolt) | MOBILE MONEY |
| Social commerce | YES (Reels/Stories) | NO | NO | GROUP CHATS |
| Campus focus | YES | NO | NO | YES |
| MoMo support | YES | YES | YES | YES |
| Escrow protection | YES | YES | YES | NO |
| Loyalty program | YES (BexieCoins) | NO | NO | NO |

---

## 11. Non-Technical Readiness Score

| Category | Score | Notes |
|----------|-------|-------|
| Feature completeness | 9/10 | All planned features built |
| Payment readiness | 9/10 | All Ghana payment methods supported |
| User experience | 8/10 | Polished UI, error handling, loading states |
| Admin capabilities | 8/10 | Comprehensive platform management |
| Revenue model | 8/10 | Commission + delivery fees + wallet fees |
| Market localization | 9/10 | Ghana-focused: MoMo, GHS, local delivery |
| Email/communication | 4/10 | Email broken on Railway, SMS works |
| Maps/location | 5/10 | Code ready, API key missing |
| Security posture | 7/10 | Strong app-level security, secrets exposure risk |
| Operational readiness | 5/10 | No CI/CD, no load testing, no runbooks |
| App store readiness | 3/10 | No store listing, screenshots, or privacy policy |
| Documentation | 5/10 | Internal docs exist, no user/developer docs |

**Overall Non-Technical Readiness: 6.5 / 10**

---

## 12. Recommended Pre-Launch Checklist

### Must-Fix Before Launch (Critical)
- [ ] **Fix email delivery** — Integrate Resend API to bypass Railway SMTP blocking
- [ ] **Provision Google Maps API key** — Enable Routes API + Geocoding API for accurate delivery
- [ ] **Rotate all secrets** — Database password, API keys, SMTP credentials
- [ ] **Purge .env from git history** — Use BFG Repo-Cleaner
- [ ] **Create Privacy Policy** — Required for app stores and legal compliance
- [ ] **Create Terms of Service** — Required for app stores

### Should-Fix Before Launch (High)
- [ ] **Set up CI/CD pipeline** — Automated testing before deployment
- [ ] **Add tests to admin app** — At minimum: dashboard, orders, vendors, settings
- [ ] **Wire push notifications** — Server-side push for order updates, messages, promotions
- [ ] **Load testing** — Simulate 100+ concurrent users, flash sale scenarios
- [ ] **Fix dependency conflicts** — Jest 30/29, Zustand 5/4 version mismatches

### Nice-to-Have Before Launch (Medium)
- [ ] **Prepare app store listings** — Screenshots, descriptions, store metadata
- [ ] **Create user documentation** — FAQ, help center, onboarding guides
- [ ] **Admin mobile responsiveness** — Hamburger menu for tablet/phone
- [ ] **Expand E2E testing** — Vendor flow, dispatcher flow, food ordering
- [ ] **Database backup verification** — Confirm Neon backup strategy

---

## 13. Timeline Estimate

| Phase | Effort | Dependencies |
|-------|--------|-------------|
| Fix email (Resend integration) | 1 day | Resend account + domain verification |
| Provision Maps API key | 30 minutes | Google Cloud billing account |
| Rotate secrets + purge git history | 2 hours | Access to all service dashboards |
| Privacy Policy + Terms of Service | 1 day | Legal review |
| CI/CD pipeline setup | 1 day | GitHub Actions configuration |
| Admin test coverage | 2-3 days | Jest + React Testing Library setup |
| Push notification service | 1-2 days | Expo push notification infrastructure |
| App store preparation | 2-3 days | Store accounts, screenshots, metadata |
| Load testing | 1-2 days | Load testing tool (k6, Artillery) |

**Estimated total time to production-ready: 7-10 business days**

---

## 14. Summary

Bexiemart is a **feature-rich, architecturally sound** platform that is approximately **85-90% production-ready**. The core product is complete and well-engineered with enterprise-grade security, real-time features, and a comprehensive admin panel. The platform fills a clear gap in the Ghanaian campus market by combining marketplace, food ordering, service booking, and delivery dispatch in a single app.

The three critical blockers — **email delivery (Resend integration), maps API provisioning, and secrets exposure** — are all fixable within 1-2 days of focused work. Once those are resolved and basic CI/CD + testing for the admin panel are added, the platform is ready for a controlled beta launch on the campus market.

**Recommendation:** Proceed to production after addressing the three critical blockers. Target a soft launch on 1-2 campuses before scaling.
