# BexieMart — Wallet Integration PRD
## Feature: In-App Wallet System (Top-Up · Transfer · Withdrawal)

**Version:** 1.0
**Date:** May 14, 2026
**Status:** Draft
**Parent PRD:** BexieMart React Native Rebuild v1.0 (April 27, 2026)
**Feature Owner:** Dev D (Vendor) + Dev C (Payments)
**Target Sprint:** Week 3 (days 5–7) + Week 4 (days 3–4) — Stretch → Promoted to v1.1
**Platforms:** iOS 15+ · Android 8+

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Goals & Success Metrics](#2-goals--success-metrics)
3. [Scope — What's In, What's Out](#3-scope--whats-in-whats-out)
4. [User Roles & Wallet Permissions](#4-user-roles--wallet-permissions)
5. [Functional Requirements](#5-functional-requirements)
   - 5.1 Wallet Dashboard
   - 5.2 Top-Up (Fund Wallet)
   - 5.3 Wallet-to-Wallet Transfer (Customer → Vendor)
   - 5.4 Withdrawal (Wallet → Bank / MoMo)
   - 5.5 Transaction History
   - 5.6 Wallet PIN — Setup & Verification
   - 5.7 Payment Method Management (Bank & MoMo Accounts)
   - 5.8 Vendor Earnings Auto-Credit
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Technical Architecture](#7-technical-architecture)
   - 7.1 Database Schema (Prisma)
   - 7.2 NestJS Backend — API Endpoints
   - 7.3 React Native — API Module & Hooks
   - 7.4 State Management (Zustand)
   - 7.5 Payment Provider Integration
   - 7.6 Project Structure Additions
8. [Screen Specifications](#8-screen-specifications)
9. [Design System — Wallet-Specific Tokens](#9-design-system--wallet-specific-tokens)
10. [Security Requirements](#10-security-requirements)
11. [Error Handling & Edge Cases](#11-error-handling--edge-cases)
12. [Implementation Plan](#12-implementation-plan)
13. [Testing Requirements](#13-testing-requirements)
14. [Risks & Mitigations](#14-risks--mitigations)
15. [Open Questions & Decisions](#15-open-questions--decisions)

---

## 1. Executive Summary

BexieMart's wallet system is a **first-party digital ledger** embedded in the campus marketplace. It enables:

- **Customers** to pre-fund a wallet and pay for orders without re-entering card details on every purchase.
- **Vendors** to receive earnings directly into their BexieMart wallet as orders are completed, and withdraw those funds to a Ghana bank account or MTN Mobile Money wallet on demand.
- **Internal peer transfers** so customers can send wallet credit to vendors (e.g., for custom orders, deposits, or off-cart payments).

The wallet is not a standalone fintech product — it is a UX accelerator for BexieMart's core commerce flows. Every design and engineering decision should optimize for **speed of checkout** and **trust**, not feature breadth.

The backend (NestJS + Prisma + PostgreSQL) already has partial wallet scaffolding referenced in the existing PRD (`VE3 — Withdraw`). This document fully specifies the feature across backend schema, API contracts, mobile screens, state management, and third-party integrations.

**Primary payment providers:**
- **Paystack** — Card top-ups, bank transfers in, bank withdrawals out (Ghana coverage)
- **MTN Mobile Money API (MoMo)** — MoMo top-ups + disbursements to MTN wallets

---

## 2. Goals & Success Metrics

| # | Goal | Success Metric |
|---|------|----------------|
| W1 | Enable wallet-based checkout as an alternative to direct card payment | ≥30% of orders paid via wallet within 60 days of launch |
| W2 | Vendor earnings automatically credited after order completion | 100% of completed orders reflect in vendor wallet within 60 seconds |
| W3 | Withdrawals to bank/MoMo succeed without manual intervention | <2% withdrawal failure rate (excluding provider-side errors) |
| W4 | Wallet top-up conversion rate | ≥70% of initiated top-ups result in successful funding |
| W5 | Security — zero double-credits or double-debits | 0 ledger inconsistency incidents in first 90 days |
| W6 | PIN setup completion after wallet creation | ≥90% of users complete PIN setup within 24 hrs of first wallet access |

---

## 3. Scope — What's In, What's Out

### ✅ IN (v1.1 Wallet Feature)

- Wallet balance display on Customer Home screen (AppBar chip) and dedicated Wallet tab
- Wallet top-up via Paystack (card + bank transfer) and MTN MoMo (collections)
- Wallet balance used as payment method during checkout (alongside existing Paystack card flow)
- Internal wallet-to-wallet transfer (Customer → Vendor, with PIN confirmation)
- Vendor wallet auto-credit on order status → `delivered`
- Withdrawal: Vendor wallet → Ghana bank account (Paystack Transfers API)
- Withdrawal: Vendor wallet → MTN Mobile Money (MTN MoMo Disbursements API)
- Saved bank accounts and MoMo numbers (add, set default, delete)
- Transaction history (paginated, filterable by type)
- Wallet PIN setup, change, and verification gate on all debit actions
- Daily/monthly withdrawal limits per user tier
- Webhook handlers for async payment/disbursement status updates
- Idempotency on all credit/debit operations

### ❌ OUT (v1.1 Wallet Feature — Consider for v2)

- Wallet-to-wallet transfer between two customers (social payments)
- Vodafone Cash / AirtelTigo Money disbursements (MTN MoMo only in v1.1)
- Scheduled/recurring withdrawals
- Wallet statement PDF export
- Multi-currency wallets (GHS only)
- Referral/reward crediting to wallet
- Wallet top-up via USSD (can be done via Paystack bank transfer workaround)
- Admin wallet freeze/audit UI (admin web dashboard only)
- Interest or float on wallet balance
- Vendor-to-vendor transfers

---

## 4. User Roles & Wallet Permissions

| Action | Customer | Vendor | Admin (web only) |
|--------|----------|--------|-----------------|
| View own wallet balance | ✅ | ✅ | ✅ |
| Top-up wallet (card / bank / MoMo) | ✅ | ✅ | ❌ |
| Pay for order using wallet balance | ✅ | ❌ | ❌ |
| Transfer wallet funds to a vendor | ✅ | ❌ | ❌ |
| Receive earnings credit from completed orders | ❌ | ✅ | ❌ |
| Withdraw wallet balance to bank | ❌ | ✅ | ❌ |
| Withdraw wallet balance to MTN MoMo | ❌ | ✅ | ❌ |
| Save / manage bank accounts | ❌ | ✅ | ❌ |
| Save / manage MoMo numbers | ✅ (top-up source) | ✅ (withdrawal destination) | ❌ |
| View full transaction history | ✅ (own) | ✅ (own) | ✅ (all) |
| Freeze any wallet | ❌ | ❌ | ✅ |
| Reverse a transaction | ❌ | ❌ | ✅ |

> **Note:** Customers who are also vendors (role can be both in the existing schema) have access to both permission sets and see both wallet contexts: a customer spending wallet and a vendor earnings wallet. In v1.1 these are the **same wallet record** — the balance is unified. The transaction history uses the `type` field to distinguish income vs expenditure.

---

## 5. Functional Requirements

### 5.1 Wallet Dashboard

| ID | Feature | Acceptance Criteria |
|----|---------|---------------------|
| WD1 | **Balance card** | Displays current balance formatted as `GHS X,XXX.XX`. Has a show/hide toggle (eye icon). Default: balance visible. |
| WD2 | **Quick action buttons** | Four pill buttons: `Top Up`, `Transfer`, `Withdraw` (vendor only), `History`. Each navigates to the corresponding flow. `Withdraw` is hidden for pure-customer accounts. |
| WD3 | **Mini transaction feed** | Last 5 transactions shown below the balance card. Each row: icon (type), description, amount (+/-), date. "See All" link → full history screen. |
| WD4 | **Balance visibility in AppBar** | A small chip on the Customer Home AppBar shows `GHS X.XX` (truncated). Tapping it navigates to the Wallet tab. Updates in real-time after any transaction. |
| WD5 | **Wallet status banner** | If wallet status is `frozen` or `suspended`, a red banner replaces the quick action buttons with a "Contact Support" CTA. |
| WD6 | **Loading state** | Skeleton placeholders on first load. Pull-to-refresh triggers balance re-fetch. |

---

### 5.2 Top-Up (Fund Wallet)

The top-up flow adds funds to the wallet via an external payment. Two sub-flows: Paystack (card + bank) and MTN MoMo (mobile money collection).

#### 5.2.1 Sub-Flow A — Paystack Top-Up (Card / Bank Transfer)

| ID | Feature | Acceptance Criteria |
|----|---------|---------------------|
| TU1 | **Amount entry screen** | Numeric input (GHS). Minimum: GHS 5.00. Maximum: GHS 5,000.00 per transaction (configurable via env). Preset amount chips: GHS 20, 50, 100, 200, 500. Custom amount input below chips. Continues to channel selection. |
| TU2 | **Channel selection** | User selects: "Pay with Card" or "Bank Transfer". Both route through Paystack. |
| TU3 | **Paystack initialization** | App POSTs to `POST /wallet/topup/initialize` with `{ amount, channel }`. Backend calls Paystack `transaction/initialize`. Returns `{ authorizationUrl, reference }`. |
| TU4 | **Payment WebView** | Opens `authorizationUrl` in an in-app WebView (same `PaymentScreen.tsx` WebView wrapper used for order payments). Intercepts callback URL. On success URL: closes WebView, navigates to verification step. On failure/cancel: returns to top-up screen with error toast. |
| TU5 | **Verification + credit** | App calls `GET /wallet/topup/verify/:reference`. Backend verifies with Paystack. On success: credits wallet atomically, marks transaction `completed`, returns new balance. App shows Success screen with new balance. |
| TU6 | **Webhook backup** | `POST /webhooks/paystack` handles `charge.success` event. Idempotency check: if transaction already `completed`, skip. Otherwise credits wallet. This is the fallback if the app-side verification call fails (e.g., user closed app mid-flow). |
| TU7 | **Success screen** | Animated checkmark. "GHS X.XX added to your wallet." Shows new balance. Two CTAs: "Shop Now" and "Back to Wallet". |

#### 5.2.2 Sub-Flow B — MTN MoMo Collection Top-Up

| ID | Feature | Acceptance Criteria |
|----|---------|---------------------|
| TU8 | **MoMo number entry** | Text input pre-filled with user's registered phone number (from profile). Editable. Validates Ghana MTN number format (`024`, `054`, `055`, `059` prefixes). |
| TU9 | **Prompt-to-pay initiation** | App POSTs to `POST /wallet/topup/momo`. Backend calls MTN MoMo Collections API (`POST /collection/v1_0/requesttopay`). Returns `{ referenceId }`. |
| TU10 | **Pending screen** | Shows "Check your phone for an MTN MoMo prompt". Animated phone/pulse illustration. Auto-polls `GET /wallet/topup/momo/status/:referenceId` every 5 seconds for up to 120 seconds. |
| TU11 | **Status resolution** | If MTN returns `SUCCESSFUL`: credit wallet, show Success screen (same as TU7). If `FAILED` or timeout: show failure screen with "Try Again" CTA. |
| TU12 | **Webhook backup** | MTN MoMo sends a callback to `POST /webhooks/momo/collections`. Backend credits wallet if not already done. |

---

### 5.3 Wallet-to-Wallet Transfer (Customer → Vendor)

Allows a customer to send wallet funds directly to a vendor's wallet inside BexieMart. Use cases: paying for a custom order, placing a deposit, tipping a vendor.

| ID | Feature | Acceptance Criteria |
|----|---------|---------------------|
| TR1 | **Initiate transfer** | Customer navigates to Transfer screen. Enters vendor identifier: either by searching vendor name/shop name within the app, or entering a vendor's BexieMart ID/username directly. |
| TR2 | **Vendor search** | Real-time search across vendor shop names. Shows: shop logo, shop name, vendor name. Select one to populate recipient field. |
| TR3 | **Amount entry** | GHS numeric input. Minimum: GHS 1.00. Must not exceed sender wallet balance (validated client-side and server-side). Optional note field (max 100 chars — stored in transaction metadata). |
| TR4 | **Transfer summary screen** | Shows: recipient shop name + logo, amount, fee (GHS 0.00 for v1.1 — internal transfers are free), net amount. "Confirm & Send" CTA. |
| TR5 | **PIN gate** | Before confirming, a 4-digit PIN entry bottom sheet appears. Incorrect PIN: shake animation + error. Three consecutive failures: 30-minute lockout. |
| TR6 | **Atomic debit/credit** | Backend executes in a single DB transaction: decrement sender balance, increment recipient balance, insert one transaction record linked to both wallets. Either both succeed or neither does. |
| TR7 | **Success confirmation** | Success screen with: recipient name, amount sent, sender new balance. Push notification sent to vendor: "You received GHS X.XX from [Customer Name]." |
| TR8 | **Insufficient balance guard** | If balance < amount: "Confirm & Send" is disabled. Below the amount input: "Your balance: GHS X.XX. Top up to continue." |

---

### 5.4 Withdrawal (Wallet → Bank Account / MTN MoMo)

Withdrawal is vendor-only. Moves funds from the BexieMart wallet to an external destination.

#### 5.4.1 Withdrawal Flow — Common Steps

| ID | Feature | Acceptance Criteria |
|----|---------|---------------------|
| WR1 | **Withdrawal entry screen** | Shows current withdrawable balance (total balance minus any pending debits). Amount input. Destination selector: "Bank Account" or "Mobile Money". |
| WR2 | **Minimum withdrawal** | GHS 10.00 minimum. Below minimum: input turns red, CTA disabled, tooltip "Minimum withdrawal is GHS 10.00". |
| WR3 | **Daily limit check** | Default daily limit: GHS 5,000.00. If today's already-withdrawn total + requested amount > limit: show "Daily limit of GHS 5,000.00 reached. Try again tomorrow." |
| WR4 | **Fee disclosure** | Before confirmation, clearly display: "Transfer fee: GHS X.XX". Fee deducted from wallet in addition to withdrawal amount. Fee schedule defined in backend config (e.g., GHS 2 flat or 0.5% — TBD). |
| WR5 | **Summary & PIN** | Full summary screen: destination, amount, fee, net received. PIN gate (same component as TR5). |
| WR6 | **Optimistic debit** | On PIN confirm: wallet is debited immediately (prevents double-spend). Transaction status = `pending`. |
| WR7 | **Async completion** | Backend initiates transfer with provider. Status updated to `completed` or `failed` via webhook. If `failed`: wallet is automatically reversed (re-credited), push notification sent: "Your withdrawal of GHS X.XX could not be processed. Funds returned to wallet." |
| WR8 | **Pending state in history** | While awaiting provider confirmation, the withdrawal appears in transaction history as "Processing…" with a spinner badge. |

#### 5.4.2 Sub-Flow A — Withdrawal to Ghana Bank Account (Paystack Transfers)

| ID | Feature | Acceptance Criteria |
|----|---------|---------------------|
| WB1 | **Bank account selector** | Dropdown/list of saved bank accounts. "Add New" option at bottom. Shows: bank name, masked account number (e.g., `****3456`), account name. Default account pre-selected. |
| WB2 | **Add bank account** | Form: bank name (searchable dropdown of Ghanaian banks from Paystack's bank list API), account number, account name. Backend verifies account via Paystack `POST /transferrecipient` before saving. If verification fails: "Account could not be verified. Check the details and try again." |
| WB3 | **Transfer initiation** | Backend calls Paystack `POST /transfer` with the saved transfer recipient code. Returns `{ transferCode, status }`. |
| WB4 | **Paystack OTP (if required)** | Paystack may prompt an OTP for large transfers. Backend relays this requirement. App shows OTP input screen. User enters OTP received on Paystack-registered number. Backend calls Paystack `POST /transfer/finalize`. |
| WB5 | **Webhook completion** | `POST /webhooks/paystack` handles `transfer.success` and `transfer.failed` events. On success: transaction marked `completed`. On failure: reversal triggered, user notified. |

#### 5.4.3 Sub-Flow B — Withdrawal to MTN Mobile Money

| ID | Feature | Acceptance Criteria |
|----|---------|---------------------|
| WM1 | **MoMo number selector** | List of saved MTN numbers. "Add New" option. Shows: number, account name (from MTN account holder lookup). |
| WM2 | **Add MoMo number** | Input Ghana MTN number. Backend calls MTN MoMo `GET /collection/v1_0/accountholder/MSISDN/{number}/basicuserinfo` to verify account exists and retrieve name. Display retrieved name for confirmation before saving. |
| WM3 | **Disbursement initiation** | Backend calls MTN MoMo Disbursements `POST /disbursement/v1_0/transfer` with `{ amount, currency: "GHS", payee: { partyIdType: "MSISDN", partyId: number } }`. Each request tagged with a UUID `X-Reference-Id`. |
| WM4 | **Status polling (internal)** | Backend polls MTN `GET /disbursement/v1_0/transfer/{referenceId}` every 30 seconds up to 5 minutes. Alternatively, MTN pushes a callback to `POST /webhooks/momo/disbursements`. |
| WM5 | **Callback handling** | On `SUCCESSFUL`: transaction marked `completed`. On `FAILED`: reversal + notification. |

---

### 5.5 Transaction History

| ID | Feature | Acceptance Criteria |
|----|---------|---------------------|
| TH1 | **Full history screen** | Paginated list (20 per page, infinite scroll). Each item: icon, title, description, amount (green `+` for credits, red `-` for debits), date/time, status badge. |
| TH2 | **Filter by type** | Filter pill row: All · Top-Up · Transfer · Withdrawal · Order Payment · Earnings. Active filter highlighted in primary blue. |
| TH3 | **Transaction detail drawer** | Tapping a transaction opens a bottom sheet with full detail: reference number, provider reference (if applicable), fee, status, timestamp, related order ID (if applicable). |
| TH4 | **Status badges** | `Completed` (green) · `Pending` / `Processing` (amber) · `Failed` (red) · `Reversed` (grey). |
| TH5 | **Empty state** | Illustration + "No transactions yet. Top up your wallet to get started." |
| TH6 | **Date grouping** | Transactions grouped by date: "Today", "Yesterday", "May 12, 2026". |

---

### 5.6 Wallet PIN — Setup & Verification

The PIN is a 4-digit code that gates all debit actions (transfers, withdrawals, wallet checkout).

| ID | Feature | Acceptance Criteria |
|----|---------|---------------------|
| PIN1 | **PIN setup prompt** | On first wallet access (after account creation or on first top-up), a full-screen modal prompts: "Set your wallet PIN". Cannot be dismissed without completing setup or explicitly "Skip for Now" (skipping disables debit actions). |
| PIN2 | **PIN entry UI** | 4 circular dots + numeric keypad (custom component, not system keyboard — avoids screenshot/keylogger risk). Input is masked. |
| PIN3 | **PIN confirmation** | User enters PIN twice. If mismatch: "PINs don't match. Try again." both inputs clear. |
| PIN4 | **Hashing** | PIN is hashed with bcrypt (cost factor 12) on the backend before storage. Never stored in plain text. Never returned in API responses. |
| PIN5 | **PIN gate bottom sheet** | Reusable `WalletPinSheet` component. Used in: transfer confirm, withdrawal confirm, wallet checkout. On success: `onSuccess()` callback fires. On 3 failures: triggers lockout. |
| PIN6 | **Lockout** | After 3 consecutive wrong PINs: 30-minute lockout. Lockout state stored server-side (not just client). During lockout: PIN sheet shows countdown timer + "Forgot PIN?" link. |
| PIN7 | **Change PIN** | In wallet settings: "Old PIN → New PIN → Confirm". Same validation flow. Old PIN must be correct. |
| PIN8 | **Forgot PIN** | Triggers email OTP (reuses existing forgot-password email infrastructure). After OTP validation: user sets new PIN. Previous PIN invalidated immediately. |
| PIN9 | **Biometric shortcut (stretch)** | After PIN setup, prompt to enable Face ID / Fingerprint as an alternative. Uses `expo-local-authentication`. Store PIN in `expo-secure-store` encrypted with device biometric key. This is optional and skippable. |

---

### 5.7 Payment Method Management (Bank & MoMo Accounts)

Accessible from Wallet Settings or during the withdrawal flow.

| ID | Feature | Acceptance Criteria |
|----|---------|---------------------|
| PM1 | **Payment methods list** | Two sections: "Bank Accounts" and "Mobile Money Numbers". Each entry: icon, name, masked number, "Default" badge if applicable. Edit and delete icons per row. |
| PM2 | **Add bank account** | Form: Bank (searchable dropdown populated from `GET /payments/banks`), Account Number, Account Name. On submit: backend verifies via Paystack and saves. |
| PM3 | **Add MoMo number** | Input MTN number. Backend does MTN account lookup. Displays retrieved account name for confirmation. User confirms → saved. |
| PM4 | **Set default** | Long-press or tap "Set as Default" on any method. Default is pre-selected in withdrawal flow. |
| PM5 | **Delete** | Confirm dialog: "Remove this account? You can add it back anytime." Cannot delete an account with a pending transaction. |
| PM6 | **Maximum saved methods** | Maximum 3 bank accounts + 3 MoMo numbers per user. Beyond limit: "Add New" is disabled with tooltip. |

---

### 5.8 Vendor Earnings Auto-Credit

| ID | Feature | Acceptance Criteria |
|----|---------|---------------------|
| VE1 | **Trigger event** | When a vendor marks an order as `delivered` (via `PATCH /orders/:id/status` with `{ status: "delivered" }`), the backend automatically calculates vendor earnings. |
| VE2 | **Earnings calculation** | `vendorEarnings = orderSubtotal - platformCommission`. Platform commission rate stored in `PlatformConfig` table (e.g., 5%). Delivery fees are excluded from commission. |
| VE3 | **Atomic credit** | Vendor wallet credited within the same DB transaction as the order status update. If wallet credit fails, order status update rolls back. |
| VE4 | **Push notification** | Vendor receives push notification: "🎉 GHS X.XX credited to your wallet for order #BXMXXXX." |
| VE5 | **Transaction record** | A transaction of type `earnings` is created: linked to the order ID in metadata, amount = vendor earnings, status = `completed`. |
| VE6 | **Dispute window** | Earnings are marked `available_for_withdrawal` 48 hours after crediting (configurable). This creates a buffer for customer dispute/refund requests. During this window the balance is visible but `Withdraw` is disabled for that specific credit amount with a tooltip: "Available in Xh Xm". For v1.1 this can be simplified: earnings are immediately withdrawable. |

---

## 6. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Atomicity** | Every balance change (credit or debit) must be wrapped in a PostgreSQL transaction. Partial updates that leave the ledger inconsistent are a critical bug. |
| **Idempotency** | All top-up and withdrawal operations keyed by a unique reference. Re-processing the same webhook must not result in a double-credit or double-debit. |
| **Consistency** | The sum of all transaction amounts for a wallet must always equal the wallet balance. Run a daily reconciliation job that alerts if divergence is detected. |
| **Latency** | Wallet balance fetch: <500ms. Internal transfer (customer → vendor): <1s end-to-end. Top-up verification: <2s. Withdrawal initiation: <2s (provider response is async). |
| **Security** | PIN hashed with bcrypt. No wallet balance or transaction data in device logs. HTTPS only. All wallet endpoints require valid JWT. Withdrawal endpoints require `role: vendor`. |
| **Availability** | Webhook endpoints must be 99.9% available. Use a queue (Bull/BullMQ) for webhook processing — never process inline in the HTTP handler. |
| **Audit Trail** | Transactions are immutable. No DELETE on the transactions table. Reversals create a new transaction of type `reversal` referencing the original. |
| **Rate Limiting** | Withdrawal endpoint: max 5 requests per 15 minutes per user. Top-up initialize: max 10 per hour per user. PIN failures: 3 strikes then 30-min lockout (server-enforced). |
| **Offline** | If device is offline: wallet balance shows last cached value with a "Last updated X min ago" label. All debit actions disabled with "No internet connection" toast. |
| **Privacy** | Account numbers shown masked in all list views (only last 4 digits). Full number only shown in the "Add Account" confirmation step. |

---

## 7. Technical Architecture

### 7.1 Database Schema (Prisma)

Add the following models to the existing `schema.prisma`. This extends the current Prisma schema used by the NestJS backend.

```prisma
// schema.prisma additions

enum WalletStatus {
  ACTIVE
  FROZEN
  SUSPENDED
}

enum TransactionType {
  TOPUP
  WITHDRAWAL
  TRANSFER_SENT
  TRANSFER_RECEIVED
  ORDER_PAYMENT
  EARNINGS
  REVERSAL
  FEE
}

enum TransactionStatus {
  PENDING
  COMPLETED
  FAILED
  REVERSED
}

enum MomoProvider {
  MTN
  VODAFONE
  AIRTELTIGO
}

model Wallet {
  id          String        @id @default(uuid())
  userId      String        @unique
  user        User          @relation(fields: [userId], references: [id])
  balance     Decimal       @default(0.00) @db.Decimal(15, 2)
  currency    String        @default("GHS")
  status      WalletStatus  @default(ACTIVE)
  pinHash     String?       // bcrypt hash of 4-digit PIN
  pinFailures Int           @default(0)
  pinLockedUntil DateTime?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  sentTransactions     Transaction[] @relation("SenderWallet")
  receivedTransactions Transaction[] @relation("RecipientWallet")
  bankAccounts         BankAccount[]
  momoAccounts         MomoAccount[]
}

model Transaction {
  id              String            @id @default(uuid())
  type            TransactionType
  status          TransactionStatus @default(PENDING)
  amount          Decimal           @db.Decimal(15, 2)
  fee             Decimal           @default(0.00) @db.Decimal(15, 2)
  currency        String            @default("GHS")
  reference       String            @unique // internal reference
  providerRef     String?           // Paystack/MTN reference
  description     String?
  metadata        Json?             // orderId, note, bankCode, etc.
  reversedById    String?           // if this is a reversal, ref to original
  
  senderWalletId    String?
  senderWallet      Wallet?  @relation("SenderWallet", fields: [senderWalletId], references: [id])
  
  recipientWalletId String?
  recipientWallet   Wallet?  @relation("RecipientWallet", fields: [recipientWalletId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([senderWalletId, createdAt])
  @@index([recipientWalletId, createdAt])
  @@index([reference])
  @@index([providerRef])
}

model BankAccount {
  id                  String   @id @default(uuid())
  walletId            String
  wallet              Wallet   @relation(fields: [walletId], references: [id])
  bankName            String
  bankCode            String   // Paystack bank code
  accountNumber       String
  accountName         String
  paystackRecipientCode String // stored after Paystack recipient creation
  isDefault           Boolean  @default(false)
  isVerified          Boolean  @default(false)
  createdAt           DateTime @default(now())

  @@unique([walletId, accountNumber])
}

model MomoAccount {
  id           String       @id @default(uuid())
  walletId     String
  wallet       Wallet       @relation(fields: [walletId], references: [id])
  provider     MomoProvider @default(MTN)
  phoneNumber  String
  accountName  String
  isDefault    Boolean      @default(false)
  isVerified   Boolean      @default(false)
  createdAt    DateTime     @default(now())

  @@unique([walletId, phoneNumber])
}

model PlatformConfig {
  id              String  @id @default(uuid())
  commissionRate  Decimal @default(0.05) @db.Decimal(5, 4) // 5%
  withdrawalFeeFlat Decimal @default(2.00) @db.Decimal(10, 2) // GHS 2
  minTopup        Decimal @default(5.00) @db.Decimal(10, 2)
  maxTopup        Decimal @default(5000.00) @db.Decimal(10, 2)
  minWithdrawal   Decimal @default(10.00) @db.Decimal(10, 2)
  dailyWithdrawalLimit Decimal @default(5000.00) @db.Decimal(10, 2)
  updatedAt       DateTime @updatedAt
}
```

---

### 7.2 NestJS Backend — API Endpoints

All endpoints are prefixed with `/api/v1`. JWT `AuthGuard` applied globally. `RolesGuard` applied where noted.

#### Wallet Core

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/wallet` | User | Get own wallet (balance, status, currency) |
| `GET` | `/wallet/summary` | User | Balance + last 5 transactions |

#### Top-Up

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/wallet/topup/initialize` | User | Initialize Paystack top-up. Body: `{ amount: number, channel: 'card' \| 'bank' }`. Returns `{ authorizationUrl, reference }`. |
| `GET` | `/wallet/topup/verify/:reference` | User | Verify Paystack top-up and credit wallet. |
| `POST` | `/wallet/topup/momo` | User | Initiate MTN MoMo collection. Body: `{ amount: number, phoneNumber: string }`. Returns `{ referenceId }`. |
| `GET` | `/wallet/topup/momo/status/:referenceId` | User | Poll MTN MoMo collection status. Returns `{ status: 'PENDING' \| 'SUCCESSFUL' \| 'FAILED', balance?: number }`. |

#### Transfers

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/wallet/transfer` | User | Transfer to another user's wallet. Body: `{ recipientUserId, amount, pin, note? }`. |
| `GET` | `/wallet/vendors/search?q=` | User | Search vendors by shop name for transfer recipient lookup. |

#### Withdrawals

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| `POST` | `/wallet/withdraw/bank` | User | Vendor | Initiate bank withdrawal. Body: `{ amount, bankAccountId, pin }`. |
| `POST` | `/wallet/withdraw/momo` | User | Vendor | Initiate MoMo withdrawal. Body: `{ amount, momoAccountId, pin }`. |
| `GET` | `/wallet/withdraw/daily-remaining` | User | Vendor | Returns `{ remaining: number, limit: number }` for today. |

#### Payment Methods

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/wallet/bank-accounts` | User | List saved bank accounts. |
| `POST` | `/wallet/bank-accounts` | User | Add + verify bank account. Body: `{ bankCode, accountNumber, accountName }`. |
| `DELETE` | `/wallet/bank-accounts/:id` | User | Remove bank account. |
| `PATCH` | `/wallet/bank-accounts/:id/default` | User | Set as default. |
| `GET` | `/wallet/momo-accounts` | User | List saved MoMo numbers. |
| `POST` | `/wallet/momo-accounts` | User | Add + verify MoMo number. Body: `{ phoneNumber, provider }`. |
| `DELETE` | `/wallet/momo-accounts/:id` | User | Remove MoMo number. |
| `PATCH` | `/wallet/momo-accounts/:id/default` | User | Set as default. |
| `GET` | `/payments/banks` | User | List Ghanaian banks from Paystack (cached, refreshed weekly). |

#### Transaction History

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/wallet/transactions` | User | Paginated history. Query params: `page`, `limit`, `type`, `status`. Returns `{ data: Transaction[], total, page, pages }`. |
| `GET` | `/wallet/transactions/:id` | User | Single transaction detail. |

#### PIN Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/wallet/pin/setup` | User | Initial PIN setup. Body: `{ pin, confirmPin }`. Fails if PIN already set. |
| `PATCH` | `/wallet/pin/change` | User | Change PIN. Body: `{ oldPin, newPin, confirmNewPin }`. |
| `POST` | `/wallet/pin/forgot` | User | Trigger PIN reset email OTP. |
| `POST` | `/wallet/pin/reset` | User | Reset PIN with OTP. Body: `{ otp, newPin, confirmNewPin }`. |

#### Webhooks (no auth — signature-verified)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/webhooks/paystack` | Paystack event handler (reuses existing, adds wallet events). |
| `POST` | `/webhooks/momo/collections` | MTN MoMo collection callback. |
| `POST` | `/webhooks/momo/disbursements` | MTN MoMo disbursement callback. |

---

### 7.3 React Native — API Module & Hooks

#### `src/api/wallet.ts`

```typescript
import { apiClient } from './client';

// Types
export interface Wallet {
  id: string;
  balance: number;
  currency: string;
  status: 'active' | 'frozen' | 'suspended';
  hasPinSet: boolean;
}

export interface WalletTransaction {
  id: string;
  type: 'topup' | 'withdrawal' | 'transfer_sent' | 'transfer_received' | 'order_payment' | 'earnings' | 'reversal';
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  amount: number;
  fee: number;
  description: string;
  reference: string;
  providerRef?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  bankCode: string;
  accountNumber: string; // masked in list responses
  accountName: string;
  isDefault: boolean;
  isVerified: boolean;
}

export interface MomoAccount {
  id: string;
  provider: 'mtn';
  phoneNumber: string;
  accountName: string;
  isDefault: boolean;
}

export interface PaginatedTransactions {
  data: WalletTransaction[];
  total: number;
  page: number;
  pages: number;
}

// API functions
export const walletApi = {
  getWallet: () => apiClient.get<Wallet>('/wallet'),
  getSummary: () => apiClient.get<{ wallet: Wallet; recentTransactions: WalletTransaction[] }>('/wallet/summary'),

  initializeTopUp: (amount: number, channel: 'card' | 'bank') =>
    apiClient.post<{ authorizationUrl: string; reference: string }>('/wallet/topup/initialize', { amount, channel }),
  verifyTopUp: (reference: string) =>
    apiClient.get<{ balance: number }>(`/wallet/topup/verify/${reference}`),

  initiateMomoTopUp: (amount: number, phoneNumber: string) =>
    apiClient.post<{ referenceId: string }>('/wallet/topup/momo', { amount, phoneNumber }),
  pollMomoTopUp: (referenceId: string) =>
    apiClient.get<{ status: 'PENDING' | 'SUCCESSFUL' | 'FAILED'; balance?: number }>(`/wallet/topup/momo/status/${referenceId}`),

  transfer: (recipientUserId: string, amount: number, pin: string, note?: string) =>
    apiClient.post<{ reference: string; newBalance: number }>('/wallet/transfer', { recipientUserId, amount, pin, note }),
  searchVendors: (q: string) =>
    apiClient.get<{ id: string; shopName: string; logoUrl: string }[]>(`/wallet/vendors/search?q=${q}`),

  withdrawToBank: (amount: number, bankAccountId: string, pin: string) =>
    apiClient.post<{ reference: string }>('/wallet/withdraw/bank', { amount, bankAccountId, pin }),
  withdrawToMomo: (amount: number, momoAccountId: string, pin: string) =>
    apiClient.post<{ reference: string }>('/wallet/withdraw/momo', { amount, momoAccountId, pin }),
  getDailyRemaining: () =>
    apiClient.get<{ remaining: number; limit: number }>('/wallet/withdraw/daily-remaining'),

  getBankAccounts: () => apiClient.get<BankAccount[]>('/wallet/bank-accounts'),
  addBankAccount: (data: { bankCode: string; accountNumber: string; accountName: string }) =>
    apiClient.post<BankAccount>('/wallet/bank-accounts', data),
  deleteBankAccount: (id: string) => apiClient.delete(`/wallet/bank-accounts/${id}`),
  setDefaultBankAccount: (id: string) => apiClient.patch(`/wallet/bank-accounts/${id}/default`),

  getMomoAccounts: () => apiClient.get<MomoAccount[]>('/wallet/momo-accounts'),
  addMomoAccount: (phoneNumber: string) =>
    apiClient.post<MomoAccount>('/wallet/momo-accounts', { phoneNumber, provider: 'mtn' }),
  deleteMomoAccount: (id: string) => apiClient.delete(`/wallet/momo-accounts/${id}`),
  setDefaultMomoAccount: (id: string) => apiClient.patch(`/wallet/momo-accounts/${id}/default`),

  getTransactions: (params: { page?: number; limit?: number; type?: string }) =>
    apiClient.get<PaginatedTransactions>('/wallet/transactions', { params }),
  getTransaction: (id: string) => apiClient.get<WalletTransaction>(`/wallet/transactions/${id}`),

  setupPin: (pin: string, confirmPin: string) => apiClient.post('/wallet/pin/setup', { pin, confirmPin }),
  changePin: (oldPin: string, newPin: string, confirmNewPin: string) =>
    apiClient.patch('/wallet/pin/change', { oldPin, newPin, confirmNewPin }),
  forgotPin: () => apiClient.post('/wallet/pin/forgot'),
  resetPin: (otp: string, newPin: string, confirmNewPin: string) =>
    apiClient.post('/wallet/pin/reset', { otp, newPin, confirmNewPin }),

  getBanks: () => apiClient.get<{ name: string; code: string }[]>('/payments/banks'),
};
```

#### `src/hooks/useWallet.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletApi } from '../api/wallet';

export const WALLET_KEYS = {
  wallet: ['wallet'] as const,
  summary: ['wallet', 'summary'] as const,
  transactions: (params: object) => ['wallet', 'transactions', params] as const,
  bankAccounts: ['wallet', 'bank-accounts'] as const,
  momoAccounts: ['wallet', 'momo-accounts'] as const,
};

export const useWallet = () =>
  useQuery({ queryKey: WALLET_KEYS.wallet, queryFn: walletApi.getWallet, staleTime: 30_000 });

export const useWalletSummary = () =>
  useQuery({ queryKey: WALLET_KEYS.summary, queryFn: walletApi.getSummary, staleTime: 15_000 });

export const useTransactions = (params: { page?: number; type?: string }) =>
  useQuery({ queryKey: WALLET_KEYS.transactions(params), queryFn: () => walletApi.getTransactions(params) });

export const useBankAccounts = () =>
  useQuery({ queryKey: WALLET_KEYS.bankAccounts, queryFn: walletApi.getBankAccounts });

export const useMomoAccounts = () =>
  useQuery({ queryKey: WALLET_KEYS.momoAccounts, queryFn: walletApi.getMomoAccounts });

export const useTopUpPaystack = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ amount, channel }: { amount: number; channel: 'card' | 'bank' }) =>
      walletApi.initializeTopUp(amount, channel),
    onSuccess: () => qc.invalidateQueries({ queryKey: WALLET_KEYS.wallet }),
  });
};

export const useTransfer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { recipientUserId: string; amount: number; pin: string; note?: string }) =>
      walletApi.transfer(data.recipientUserId, data.amount, data.pin, data.note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WALLET_KEYS.wallet });
      qc.invalidateQueries({ queryKey: WALLET_KEYS.transactions({}) });
    },
  });
};

export const useWithdrawToBank = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { amount: number; bankAccountId: string; pin: string }) =>
      walletApi.withdrawToBank(data.amount, data.bankAccountId, data.pin),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WALLET_KEYS.wallet });
      qc.invalidateQueries({ queryKey: WALLET_KEYS.transactions({}) });
    },
  });
};

export const useWithdrawToMomo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { amount: number; momoAccountId: string; pin: string }) =>
      walletApi.withdrawToMomo(data.amount, data.momoAccountId, data.pin),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WALLET_KEYS.wallet });
      qc.invalidateQueries({ queryKey: WALLET_KEYS.transactions({}) });
    },
  });
};
```

---

### 7.4 State Management (Zustand)

Add a `walletStore.ts` to the existing `src/stores/` directory.

```typescript
// src/stores/walletStore.ts
import { create } from 'zustand';

interface WalletState {
  balance: number | null;
  currency: string;
  hasPinSet: boolean;
  balanceVisible: boolean;
  setBalance: (balance: number) => void;
  setHasPinSet: (value: boolean) => void;
  toggleBalanceVisibility: () => void;
  clearWallet: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: null,
  currency: 'GHS',
  hasPinSet: false,
  balanceVisible: true,
  setBalance: (balance) => set({ balance }),
  setHasPinSet: (hasPinSet) => set({ hasPinSet }),
  toggleBalanceVisibility: () => set((s) => ({ balanceVisible: !s.balanceVisible })),
  clearWallet: () => set({ balance: null, hasPinSet: false }),
}));
```

Also add wallet balance to the AppBar chip by reading `walletStore.balance` in `CustomerTabs.tsx`. Sync balance on every app foreground event using `AppState` listener.

---

### 7.5 Payment Provider Integration

#### Paystack Configuration

```typescript
// src/utils/constants.ts additions
export const PAYSTACK_PUBLIC_KEY = process.env.EXPO_PUBLIC_PAYSTACK_KEY!;
export const WALLET_CALLBACK_URL = `${process.env.EXPO_PUBLIC_APP_SCHEME}://wallet/topup/callback`;
```

The existing `PaymentScreen.tsx` WebView wrapper (built for order payments in the main PRD) is **reused without modification** for wallet top-ups. The only difference is the `callbackUrl` and the verification endpoint called after success. Pass `source: 'wallet_topup'` in the metadata to distinguish it from order payments in the Paystack dashboard.

#### MTN MoMo API — Environment Variables (Backend)

```env
# .env (NestJS backend)
MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com   # or https://proxy.momoapi.mtn.com for production
MOMO_ENVIRONMENT=sandbox                               # or production
MOMO_COLLECTIONS_PRIMARY_KEY=<from developer portal>
MOMO_DISBURSEMENTS_PRIMARY_KEY=<from developer portal>
MOMO_API_USER=<uuid provisioned via API>
MOMO_API_KEY=<generated key>
MOMO_CALLBACK_URL=https://api.bexiemart.com/webhooks/momo/collections
MOMO_DISBURSEMENT_CALLBACK_URL=https://api.bexiemart.com/webhooks/momo/disbursements
```

#### Paystack Environment Variables (Backend — additions)

```env
PAYSTACK_TRANSFER_ENABLED=true
PAYSTACK_WALLET_CALLBACK_URL=https://api.bexiemart.com/wallet/topup/callback
```

---

### 7.6 Project Structure Additions

New files and folders added to the existing structure defined in the main PRD:

```
src/
├── screens/
│   ├── customer/
│   │   └── wallet/                         ← NEW
│   │       ├── WalletScreen.tsx            # Main wallet tab (balance + quick actions + mini feed)
│   │       ├── TopUpScreen.tsx             # Amount entry + channel selector
│   │       ├── TopUpMomoScreen.tsx         # MoMo number entry + pending polling
│   │       ├── TransferScreen.tsx          # Vendor search + amount + note
│   │       ├── TransferConfirmScreen.tsx   # Summary + PIN gate
│   │       └── TransactionHistoryScreen.tsx
│   ├── vendor/
│   │   └── wallet/                         ← NEW
│   │       ├── WithdrawScreen.tsx          # Amount + destination selector
│   │       ├── WithdrawBankScreen.tsx      # Bank account selector + confirmation
│   │       ├── WithdrawMomoScreen.tsx      # MoMo selector + confirmation
│   │       └── PaymentMethodsScreen.tsx    # Manage bank + MoMo accounts
│   └── shared/
│       └── wallet/                         ← NEW
│           ├── PinSetupScreen.tsx          # First-time PIN setup
│           ├── PinChangeScreen.tsx         # Change existing PIN
│           └── TransactionDetailScreen.tsx # Full transaction detail (bottom sheet or screen)
├── components/
│   ├── wallet/                             ← NEW
│   │   ├── BalanceCard.tsx                 # Balance display with eye toggle
│   │   ├── WalletPinSheet.tsx              # Reusable PIN entry bottom sheet
│   │   ├── PinKeypad.tsx                   # Custom 4-dot + number grid PIN input
│   │   ├── TransactionItem.tsx             # Single row in transaction list
│   │   ├── TransactionTypeIcon.tsx         # Colored icon per transaction type
│   │   ├── QuickActionButtons.tsx          # Top-Up / Transfer / Withdraw / History
│   │   ├── BankAccountCard.tsx             # Bank account row in list
│   │   └── MomoAccountCard.tsx             # MoMo account row in list
├── api/
│   └── wallet.ts                           ← NEW (full module above)
├── hooks/
│   └── useWallet.ts                        ← NEW (full hook module above)
└── stores/
    └── walletStore.ts                      ← NEW
```

#### Navigation Updates

Add `WalletStack` navigator to `CustomerTabs.tsx` (currently the "3rd placeholder" tab):

```typescript
// CustomerTabs.tsx addition
<Tab.Screen
  name="Wallet"
  component={WalletStackNavigator}
  options={{
    tabBarLabel: 'Wallet',
    tabBarIcon: ({ color }) => <WalletIcon color={color} />,
  }}
/>
```

Add `PaymentMethodsScreen` to `VendorTabs.tsx` under the Settings tab navigator (accessible from Settings screen → "Payment Methods" row).

---

## 8. Screen Specifications

### 8.1 Wallet Dashboard (WalletScreen.tsx)

**Layout (top → bottom):**
1. Header: "My Wallet" title + Settings gear icon (→ PaymentMethodsScreen)
2. `BalanceCard` — rounded card, primary blue background, white text
   - Label: "Available Balance"
   - Value: `GHS 1,250.00` (Raleway 700, 32px) or `GHS ●●●.●●` if hidden
   - Eye icon toggle (top-right of card)
   - Currency chip: "GHS" pill (bottom-left of card)
3. `QuickActionButtons` — 4 buttons in a row: [Top Up] [Transfer] [Withdraw*] [History]
   - *Withdraw: visible only if `user.role === 'vendor'`
4. Section title: "Recent Transactions"
5. Last 5 `TransactionItem` rows
6. "See All Transactions" text link → `TransactionHistoryScreen`
7. Empty state (if 0 transactions): illustration + "Your transactions will appear here"

**AppBar balance chip:** a small `GHS X.XX` chip in the Customer home AppBar. Source: `walletStore.balance`. If balance is null (not yet loaded): shows a small loading shimmer. Tap → navigates to WalletScreen.

---

### 8.2 Top-Up Screen (TopUpScreen.tsx)

**Layout:**
1. Back button header: "Add Money"
2. "How much would you like to add?" label
3. Preset chips: `GHS 20` `GHS 50` `GHS 100` `GHS 200` `GHS 500`. Tapping a chip fills the input.
4. `FormInput` — numeric keyboard, GHS prefix, placeholder "0.00"
5. Min/max helper text: "Min: GHS 5.00 · Max: GHS 5,000.00"
6. "Choose payment method" section header
7. Two option cards (selectable):
   - 💳 **Card / Bank Transfer** — "Pay with your debit card or bank" — powered by Paystack logo
   - 📱 **MTN Mobile Money** — "Pay from your MoMo wallet"
8. Primary `Button`: "Continue" — disabled if amount is 0 or below min
9. On continue: if Card selected → call `initializeTopUp` → open `PaymentScreen` WebView. If MoMo → navigate to `TopUpMomoScreen`.

---

### 8.3 Transfer Screen (TransferScreen.tsx + TransferConfirmScreen.tsx)

**TransferScreen:**
1. Header: "Send Money"
2. Search bar: "Search vendor by shop name" — shows dropdown with `{ shopName, logoUrl }` results from `/wallet/vendors/search`
3. Selected recipient card (after selection): shop logo, shop name, "Change" button
4. Amount input: numeric, GHS prefix
5. "Balance: GHS X.XX" sub-label
6. Note input (optional): "Add a note (optional)"
7. "Continue" CTA → `TransferConfirmScreen`

**TransferConfirmScreen:**
1. Header: "Confirm Transfer"
2. Summary card:
   - To: Shop logo + name
   - Amount: `GHS X.XX`
   - Fee: `GHS 0.00 (Free)`
   - Total debited: `GHS X.XX`
3. "Confirm & Send" CTA → triggers `WalletPinSheet`
4. On PIN success: calls `useTransfer` mutation → Success screen

---

### 8.4 Withdrawal Screen (WithdrawScreen.tsx)

1. Header: "Withdraw Funds"
2. Current balance card (condensed version of BalanceCard, read-only)
3. Amount input with daily limit reminder: "Daily limit remaining: GHS X,XXX.XX"
4. Fee disclosure: "Transfer fee: GHS 2.00 will be deducted from your wallet"
5. Destination selector: two cards — [🏦 Bank Account] [📱 MTN MoMo]
6. Selected destination shows saved accounts/numbers (from API) or "Add New" if none saved
7. "Withdraw" CTA → `WalletPinSheet` → calls appropriate withdrawal mutation
8. Pending screen after submit: "Your withdrawal is being processed. We'll notify you when it's done."

---

### 8.5 Transaction History Screen (TransactionHistoryScreen.tsx)

1. Header: "Transaction History"
2. Filter pills (horizontal scroll): All · Top-Up · Transfer · Withdrawal · Payment · Earnings
3. Grouped `FlatList` with date headers ("Today", "Yesterday", specific dates)
4. Each `TransactionItem`:
   - Left: colored icon circle (type-specific icon)
   - Center: description + date/time
   - Right: amount `+GHS X.XX` (green) or `-GHS X.XX` (red), status badge below
5. Tap row → `TransactionDetailScreen` (modal bottom sheet)
6. Infinite scroll — `onEndReached` fetches next page
7. Empty state per filter

---

### 8.6 PIN Setup Screen (PinSetupScreen.tsx)

1. Lock icon illustration
2. "Set Your Wallet PIN" title
3. "Choose a 4-digit PIN to secure your wallet transactions"
4. `PinKeypad` component — 4 dot indicators + digit buttons (1–9, 0, delete)
5. Step 1: "Enter PIN" → Step 2: "Confirm PIN" → API call → success toast
6. "Skip for Now" text button (bottom) — navigates away, debit actions will prompt setup later

---

### 8.7 Wallet PIN Sheet (WalletPinSheet.tsx)

Reusable bottom sheet (using `@gorhom/bottom-sheet` — already likely a dep, or use a `Modal`):

1. Title: "Enter Wallet PIN"
2. `PinKeypad` with 4-dot display
3. Error state: red dots + shake animation + "Incorrect PIN (X attempts remaining)"
4. Lockout state: "Too many attempts. Try again in 28:45" (countdown) + "Forgot PIN?" link
5. "Cancel" button dismisses sheet without firing `onSuccess`

---

## 9. Design System — Wallet-Specific Tokens

Extends the existing BexieMart design system defined in Section 8 of the main PRD.

```typescript
// src/theme/colors.ts additions
export const walletColors = {
  balanceCardBg: '#004CFF',       // primary — matches brand
  balanceCardText: '#FFFFFF',
  creditAmount: '#08A81D',         // success green — matches existing
  debitAmount: '#B3261E',          // error red — matches existing
  pendingBadge: '#F59E0B',         // warning amber — matches existing
  reversedBadge: '#5F6C7B',        // textSecondary

  // Transaction type icon backgrounds (circular)
  topupIconBg: '#E8F5E9',
  topupIconColor: '#08A81D',
  withdrawIconBg: '#FBE9E7',
  withdrawIconColor: '#B3261E',
  transferIconBg: '#E3F2FD',
  transferIconColor: '#004CFF',
  earningsIconBg: '#FFF8E1',
  earningsIconColor: '#F59E0B',

  // PIN keypad
  pinDotActive: '#004CFF',
  pinDotEmpty: '#E4E7EC',
  pinKeyBg: '#F5F5F5',
  pinKeyPressed: '#E4E7EC',
};
```

```typescript
// src/theme/spacing.ts — no new additions needed
// Use existing scale: 4, 8, 12, 16, 20, 24, 32, 64

// New wallet-specific component sizing:
export const walletMetrics = {
  balanceCardRadius: 20,
  balanceCardPaddingH: 24,
  balanceCardPaddingV: 28,
  pinDotSize: 16,
  pinDotSpacing: 20,
  transactionIconSize: 44,    // meets 44pt touch target rule
  quickActionButtonWidth: 72,
};
```

---

## 10. Security Requirements

| Requirement | Implementation |
|-------------|---------------|
| **PIN storage** | Hashed with `bcrypt` (cost 12) in `Wallet.pinHash`. Never returned in API responses. |
| **PIN transmission** | PIN sent over HTTPS in request body. Never logged server-side. Axios interceptor must not log wallet mutation bodies. |
| **Balance visibility** | `balanceVisible` toggle stored in `walletStore` (in-memory only — not persisted). Resets to `true` on app restart. This is a UX feature, not a security feature. |
| **JWT scope** | Wallet endpoints require valid JWT. Withdrawal endpoints additionally require `role: vendor` claim. |
| **Webhook signature** | Paystack: validate `x-paystack-signature` HMAC-SHA512. MTN MoMo: validate callback using provisioned API key. Reject any webhook without valid signature with 401. |
| **Idempotency keys** | All Paystack transfer calls include `reference` header. MTN MoMo calls include `X-Reference-Id` (UUID). Duplicate references on server → return 200 but do not re-process. |
| **Sensitive logging exclusion** | `accountNumber`, `pinHash`, `pin` (from request body) must appear in the NestJS logger exclusion list. |
| **Rate limiting** | Applied via NestJS `ThrottlerModule` on wallet debit endpoints. Values per Section 6. |
| **Input validation** | All request bodies validated with `class-validator` DTOs on the NestJS side. Zod schemas on the React Native side before any API call. |
| **Minimum transfer checks** | Always validated server-side, even if client enforces them. Client-side validation is UX only. |

---

## 11. Error Handling & Edge Cases

| Scenario | User-Facing Behaviour | System Behaviour |
|----------|-----------------------|-----------------|
| Top-up initialized but user closes app before verification | Next time user opens wallet, pending top-up detected via `GET /wallet/transactions?status=pending&type=topup`. Prompt: "You have an unverified top-up. Verify now?" | Webhook will credit wallet automatically if Paystack confirms. App-side verification is a shortcut. |
| Paystack top-up webhook arrives twice (duplicate) | No visible effect | Idempotency check: if `transaction.status === 'completed'` → skip. Return 200. |
| MTN MoMo collection times out (user didn't approve prompt) | After 120s polling: "Your MoMo payment wasn't confirmed. Please try again." | Transaction marked `failed`. No wallet credit. |
| Withdrawal initiated but Paystack transfer fails | Push notification: "Your withdrawal of GHS X.XX could not be processed. Your funds have been returned." | Reversal transaction created. Wallet re-credited. Transaction marked `reversed`. |
| Insufficient wallet balance at server-side check | Toast: "Insufficient wallet balance." HTTP 400 with code `INSUFFICIENT_BALANCE`. | Request rejected. No DB changes. |
| Daily withdrawal limit exceeded | Modal: "You've reached your daily withdrawal limit of GHS 5,000.00. Try again tomorrow." | HTTP 400 with code `DAILY_LIMIT_EXCEEDED`. |
| Bank account verification fails (Paystack rejects account) | "We couldn't verify this account. Please check the account number and try again." | Account not saved. |
| Network error during transfer | Optimistic UI not used for transfers. Show: "Transfer failed. Your balance was not charged. Please try again." | If server already debited but response was lost: idempotency on `reference` field prevents double-debit on retry. Ensure client always sends same `reference` on retry. |
| Wallet status is `frozen` | All debit and credit actions disabled. Banner: "Your wallet has been suspended. Contact support at support@bexiemart.com" | Backend returns 403 for any wallet operation. |
| PIN entry while locked out | Keypad disabled. Countdown timer visible. "Forgot PIN?" link available. | Server returns 403 with `PIN_LOCKED` code + `lockedUntil` timestamp. |
| User attempts withdrawal without saved accounts | "No bank account / MoMo number saved. Add one to withdraw." With "Add Account" CTA. | Client-side guard — no API call made. |

---

## 12. Implementation Plan

This wallet feature is scoped as a **v1.1 release**, starting immediately after the v1.0 ship in Week 4. It can also be parallelised during Week 4 polish days by Dev D (Vendor) and Dev C (Payments) as a stretch goal if ahead of schedule.

### Phase 1 — Backend Foundation (Days 1–4)

| Day | Dev / Role | Task |
|-----|-----------|------|
| 1 | Backend (Dev A support) | Prisma schema additions: `Wallet`, `Transaction`, `BankAccount`, `MomoAccount`, `PlatformConfig` models. Migration. |
| 1 | Backend | `WalletModule`: service, controller, DTOs scaffold. Route registration. |
| 2 | Backend | `GET /wallet`, wallet auto-creation on user register (hook into existing auth flow). `WalletPinService`: setup, verify, lockout logic. |
| 2 | Backend | Paystack top-up: `POST /wallet/topup/initialize`, `GET /wallet/topup/verify/:reference`. |
| 3 | Backend | MTN MoMo Collections: `POST /wallet/topup/momo`, `GET /wallet/topup/momo/status/:referenceId`. MoMo token management service (OAuth2 client_credentials). |
| 3 | Backend | Internal transfer: `POST /wallet/transfer` with full atomic DB transaction. |
| 4 | Backend | Withdrawal to bank: `POST /wallet/withdraw/bank` (Paystack Transfers). Transfer recipient creation + caching. |
| 4 | Backend | Withdrawal to MoMo: `POST /wallet/withdraw/momo` (MTN MoMo Disbursements). |

### Phase 2 — Backend Webhooks & Payment Methods (Days 5–7)

| Day | Task |
|-----|------|
| 5 | Paystack webhook additions: `charge.success` (top-up), `transfer.success`, `transfer.failed`. Idempotency middleware. |
| 5 | MTN MoMo webhooks: collections callback, disbursements callback. |
| 6 | `GET/POST/DELETE /wallet/bank-accounts` + Paystack account verification. `GET/POST/DELETE /wallet/momo-accounts` + MTN account lookup. |
| 6 | Vendor earnings auto-credit: hook into `OrderService.updateStatus()` — on `delivered`, compute and credit vendor wallet atomically. |
| 7 | Transaction history endpoints with pagination + filters. Daily limit service. Platform config seeding. Integration tests for happy path + reversal flow. |

### Phase 3 — React Native Screens (Days 8–14)

| Day | Dev | Task |
|-----|-----|------|
| 8 | Dev C | `walletApi.ts` full module. `useWallet.ts` hooks. `walletStore.ts`. Wallet tab navigation scaffold. |
| 8 | Dev D | `BalanceCard`, `QuickActionButtons`, `TransactionItem`, `TransactionTypeIcon` components. |
| 9 | Dev C | `WalletScreen.tsx` — full dashboard wired to API. Balance chip in Customer AppBar. |
| 9 | Dev D | `PinKeypad`, `WalletPinSheet` components. `PinSetupScreen`. PIN setup prompt modal on first wallet access. |
| 10 | Dev C | `TopUpScreen.tsx` — amount entry + channel selection. Paystack WebView reuse for card top-up. |
| 10 | Dev D | `TopUpMomoScreen.tsx` — number entry + pending/polling screen. |
| 11 | Dev C | `TransferScreen.tsx` + `TransferConfirmScreen.tsx` — vendor search, amount, PIN gate. |
| 11 | Dev D | `WithdrawScreen.tsx`, `WithdrawBankScreen.tsx`, `WithdrawMomoScreen.tsx`. |
| 12 | Dev C | `TransactionHistoryScreen.tsx` — filtered, grouped, paginated list. `TransactionDetailScreen.tsx` bottom sheet. |
| 12 | Dev D | `PaymentMethodsScreen.tsx` — bank + MoMo management. Add Bank Account flow (bank picker → account verify). Add MoMo flow (number → MTN lookup confirm). |
| 13 | Both | `PinChangeScreen.tsx`. Forgot PIN flow (OTP reuse). Wallet checkout integration: add "Pay with Wallet" option to existing `CheckoutScreen.tsx`. |
| 13 | Both | Earnings auto-credit visible in vendor wallet. Vendor withdrawal from `EarningsScreen.tsx` → `WithdrawScreen.tsx` navigation. |
| 14 | Both | Error state sweep. Loading states. Offline behaviour. Empty states. Full flow testing on real devices (iOS + Android). |

### Phase 4 — QA & Security Review (Days 15–16)

| Day | Task |
|-----|------|
| 15 | End-to-end happy path tests: top-up (card + MoMo) → purchase with wallet → vendor earns → vendor withdraws (bank + MoMo). |
| 15 | Edge case testing: insufficient balance, daily limit, PIN lockout, duplicate webhook, withdrawal reversal. |
| 16 | Security review: confirm no sensitive data in logs, PIN hashing verified, rate limits tested, webhook signature validation confirmed. Sign off. |

---

## 13. Testing Requirements

### Unit Tests (Backend — Jest)

| Test | What to cover |
|------|--------------|
| `WalletService.creditWallet()` | Correct increment. Idempotency on duplicate reference. Throws on frozen wallet. |
| `WalletService.debitWallet()` | Correct decrement. Throws `INSUFFICIENT_BALANCE` when balance < amount. Atomic rollback on error. |
| `WalletService.transfer()` | Both wallets updated in single transaction. Rollback if recipient wallet not found. |
| `PinService.verifyPin()` | Correct hash comparison. Increments `pinFailures` on mismatch. Lockout triggered at 3 failures. Locked-out wallet returns `PIN_LOCKED`. |
| `WithdrawalService.checkDailyLimit()` | Correctly sums today's withdrawals. Rejects at limit. |
| `WebhookService.handlePaystackEvent()` | `charge.success`: credits wallet exactly once. Duplicate call: skipped. |
| `EarningsService.creditVendorOnDelivery()` | Commission calculated correctly. Atomic with order status update. |

### Integration Tests (Supertest)

- `POST /wallet/topup/initialize` → returns `authorizationUrl`.
- `GET /wallet/topup/verify/:reference` with Paystack sandbox — credits wallet, balance increases.
- `POST /wallet/transfer` — sender balance decreases, recipient increases, sum unchanged.
- `POST /wallet/withdraw/bank` with Paystack sandbox transfer.
- `POST /webhooks/paystack` with duplicate reference — processes once.

### React Native — Manual Test Matrix

| Flow | iOS | Android |
|------|-----|---------|
| Top-up via card (Paystack WebView) | ✅ | ✅ |
| Top-up via MoMo (sandbox) | ✅ | ✅ |
| Transfer to vendor | ✅ | ✅ |
| Withdrawal to bank | ✅ | ✅ |
| Withdrawal to MoMo | ✅ | ✅ |
| PIN setup → first wallet access | ✅ | ✅ |
| PIN lockout after 3 failures | ✅ | ✅ |
| Forgot PIN → email OTP → reset | ✅ | ✅ |
| Insufficient balance guard | ✅ | ✅ |
| Daily limit guard | ✅ | ✅ |
| Transaction history filters | ✅ | ✅ |
| Add bank account (verify) | ✅ | ✅ |
| Add MoMo number (verify) | ✅ | ✅ |
| Wallet checkout in order flow | ✅ | ✅ |
| App closed mid-top-up → reopen → webhook credited | ✅ | ✅ |
| Withdrawal failure → reversal → notification | ✅ | ✅ |
| Offline wallet screen (cached balance) | ✅ | ✅ |

---

## 14. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| **MTN MoMo sandbox instability** | High | MTN sandbox is notoriously unreliable. Mock the MTN client behind a `MomoGateway` interface so sandbox can be swapped for a local stub during development. Only test real MoMo in production staging. |
| **Double-credit from duplicate webhooks** | Critical | Idempotency middleware checks `transaction.reference` before any credit/debit. Add a `UNIQUE` constraint on `Transaction.reference` at DB level — any duplicate insert will throw, which the webhook handler catches and returns 200 silently. |
| **Paystack OTP requirement on withdrawals** | Medium | Not all transfers require OTP. Handle the `pending_otp` status from Paystack and surface an OTP input screen in the app. Test with accounts that trigger OTP. |
| **Atomic failure: order delivered but vendor not credited** | Critical | Use a single DB transaction wrapping both `order.status = delivered` and `wallet.balance += earnings`. If wallet credit throws, the entire transaction rolls back and order stays in previous state. Retry mechanism on backend. |
| **Ghana bank list changes** | Low | Cache bank list from Paystack weekly with a cron job. Store in Redis or DB. Never fetch real-time per request. |
| **Currency exposure** | Low | GHS only. No FX in v1.1. If international expansion is planned, design `Wallet.currency` now (already in schema) but do not implement FX logic. |
| **User sends transfer to wrong vendor** | Medium | Show vendor logo + name in confirmation screen clearly. No refund automation in v1.1 — "transfer is final" warning on confirm screen. Add dispute flow in v2. |
| **Expo SecureStore limitations on Android** | Low | `expo-secure-store` on Android has a 2048-byte limit per key. Wallet data is not stored there (only JWT tokens are). No issue. |
| **App store review of wallet/financial features** | Medium | Apple and Google may request additional documentation for apps handling financial transactions. Prepare: privacy policy with financial data section, data deletion flow, and ensure no actual banking licence claims are made. Position as "stored value" not "bank account." |

---

## 15. Open Questions & Decisions

| # | Question | Options | Decision Needed By |
|---|----------|---------|-------------------|
| Q1 | Should customers be able to withdraw from their wallet (not just vendors)? | A) Vendor-only (v1.1) B) Both roles | Before Phase 1 kickoff |
| Q2 | Withdrawal fee structure: flat or percentage? | A) GHS 2.00 flat B) 0.5% of amount C) Tiered | Before Phase 1 Day 4 |
| Q3 | Should earnings have a 48-hour hold before withdrawal? | A) Immediate (simpler) B) 48h hold (safer for disputes) | Before Phase 2 Day 6 |
| Q4 | Biometric PIN shortcut — include in v1.1 or push to v2? | A) v1.1 stretch B) v2 | Before Phase 3 Day 9 |
| Q5 | Should internal transfers (customer → vendor) be free forever or monetised in future? | A) Free (goodwill) B) Small fee eventually | Before Phase 1 kickoff (affects schema design) |
| Q6 | MTN-only or multi-MoMo-provider for withdrawal? | A) MTN only (v1.1) B) All three (MTN, Vodafone, AirtelTigo) — requires 3× API integrations | Before Phase 1 Day 3 |
| Q7 | Paystack or Flutterwave for bank withdrawals? | A) Paystack (already integrated for order payments — reuse) B) Flutterwave (broader Ghana bank coverage) | Before Phase 1 Day 4 |

---

*Generated from BexieMart React Native Rebuild PRD (April 27, 2026) analysis. May 14, 2026.*
*Stack: React Native (Expo) · TypeScript · NestJS · Prisma · PostgreSQL · Paystack · MTN MoMo API · TanStack Query · Zustand*
