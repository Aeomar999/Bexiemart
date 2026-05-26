# BexieMart — Paystack Integration Setup Manual
## From Dashboard Registration to Production-Ready Code

**Version:** 1.0
**Date:** May 14, 2026
**Project:** BexieMart Campus Marketplace (React Native + NestJS)
**Scope:** Wallet Top-Up · Order Payments · Bank Withdrawals · Mobile Money · Webhooks

---

## Table of Contents

1. [Account Creation & Business Registration](#1-account-creation--business-registration)
2. [Dashboard Orientation](#2-dashboard-orientation)
3. [API Keys — Test & Live](#3-api-keys--test--live)
4. [Compliance & Business Activation](#4-compliance--business-activation)
5. [Webhook Configuration](#5-webhook-configuration)
6. [Callback URL Configuration](#6-callback-url-configuration)
7. [Enabling Transfers (Withdrawals)](#7-enabling-transfers-withdrawals)
8. [Mobile Money Setup (Ghana — MoMo Collections)](#8-mobile-money-setup-ghana--momo-collections)
9. [Team & Permissions Setup](#9-team--permissions-setup)
10. [IP Whitelisting](#10-ip-whitelisting)
11. [NestJS Backend Integration](#11-nestjs-backend-integration)
12. [React Native Integration](#12-react-native-integration)
13. [Testing with Paystack Sandbox](#13-testing-with-paystack-sandbox)
14. [Going Live — Pre-Launch Checklist](#14-going-live--pre-launch-checklist)
15. [Environment Variables Reference](#15-environment-variables-reference)
16. [Common Errors & Fixes](#16-common-errors--fixes)

---

## 1. Account Creation & Business Registration

### Step 1.1 — Create a Paystack Account

1. Open your browser and navigate to **[https://dashboard.paystack.com/#/signup](https://dashboard.paystack.com/#/signup)**
2. Fill in the registration form:
   - **First Name / Last Name** — Your personal name (not the business name)
   - **Email Address** — Use a business email address (e.g. `dev@bexiemart.com` or `payments@bexiemart.com`). This will be the primary account owner email.
   - **Password** — Minimum 8 characters. Use a strong, unique password. Store it in a password manager.
   - **Country** — Select **Ghana**. This is critical — it determines which payment channels, currencies (GHS), and banking partners are available to you.
   - **Phone Number** — A valid Ghana phone number. Paystack will use this for account security and OTP verification.
3. Accept the Terms of Service and click **Create Account**.
4. Check your email inbox for a verification email from Paystack. Click the **Verify Email** button in the email.
5. You will be redirected to the Paystack Dashboard and placed in **Test Mode** by default.

> **Important:** The account you create here is the merchant/business account, not a personal wallet. All BexieMart transactions — customer payments, vendor withdrawals, and wallet top-ups — will flow through this single Paystack integration.

---

### Step 1.2 — First Login & Dashboard Access

After verifying your email:

1. Log into the dashboard at **[https://dashboard.paystack.com](https://dashboard.paystack.com)**
2. You will see a small toggle at the **top-right corner** of the dashboard labelled **Test Mode**. This means all API calls using your Test keys will go through Paystack's sandbox — no real money moves.
3. Keep this toggle in **Test Mode** during all development. You will switch to **Live Mode** only after completing compliance (Section 4) and passing pre-launch checks (Section 14).

---

## 2. Dashboard Orientation

Familiarise yourself with these key sections before touching any code:

| Section | Location | Purpose for BexieMart |
|---------|----------|-----------------------|
| **Transactions** | Left sidebar | View all payment attempts from customers — successful, failed, abandoned |
| **Transfers** | Left sidebar | View outgoing payments to vendors (withdrawals to bank/MoMo) |
| **Customers** | Left sidebar | List of all unique email addresses that have transacted through BexieMart |
| **Settings → API Keys & Webhooks** | Top-right gear icon → Settings | Get your Test/Live keys, set webhook URL, set callback URL |
| **Settings → Preferences** | Settings menu | Enable/disable OTP for transfers, configure transfer OTP |
| **Compliance** | Left sidebar | Submit business documents for live mode activation |
| **Balance** | Top of dashboard | Your Paystack Settlement Balance — vendor withdrawal funds come from here |

---

## 3. API Keys — Test & Live

### Step 3.1 — Retrieve Your Test Keys

Test keys are available immediately after signup — no compliance needed.

1. In the dashboard, click the **Settings** icon (gear) in the top-right or left sidebar.
2. Click the **API Keys & Webhooks** tab.
3. Scroll to the section labelled **API Configuration — Test Mode**.
4. You will see two keys:
   - **Test Public Key** — Starts with `pk_test_`. This goes in your React Native app (`.env` file, `EXPO_PUBLIC_` prefix so it is safe to expose).
   - **Test Secret Key** — Starts with `sk_test_`. This goes **only** in your NestJS backend `.env`. Never in the mobile app. Never in Git.
5. To reveal the secret key, click the **eye icon** beside it. You will be prompted to enter your Paystack account password.
6. Copy both keys immediately and add them to your project `.env` files.

### Step 3.2 — Retrieve Your Live Keys

Live keys are only available after your Compliance forms are approved (see Section 4).

1. Toggle to **Live Mode** using the switch in the top-right.
2. Go to **Settings → API Keys & Webhooks**.
3. Scroll to **API Configuration — Live Mode**.
4. Follow the same steps as above (click eye → enter password → copy).
5. Live keys start with `pk_live_` (public) and `sk_live_` (secret).

### Step 3.3 — Rotate Keys (When Needed)

If a key is compromised or you want to rotate periodically:

1. Go to **Settings → API Keys & Webhooks**.
2. Below the secret key section, click **Generate New Secret Key**.
3. Choose an expiry window for your **old key** (options: immediately, 1 hour, 24 hours). This grace period lets in-flight requests using the old key complete.
4. Enter your account password and click **Generate New Secret Key**.
5. Update your backend `.env` immediately and redeploy.

> **Security rule:** Never commit `sk_test_` or `sk_live_` keys to Git. Add `.env` to `.gitignore` on day one. Use a secrets manager (AWS Secrets Manager, Doppler, etc.) for production.

---

## 4. Compliance & Business Activation

Compliance is required before you can accept real money from customers (Live Mode). This process typically takes 1–3 business days.

### Step 4.1 — Navigate to Compliance

1. Click **Compliance** in the left sidebar.
2. You will see a multi-step form with the following sections:

### Step 4.2 — Profile Setup

Fill in:
- **Business Name:** `BexieMart` (or your registered business name)
- **Business Type:** Select the type that applies — if BexieMart is a registered company, choose `Company`. If it is a sole proprietorship or startup not yet formally registered, choose `Starter Business`.
- **Business Category:** `Marketplace` or `E-commerce`
- **Business Website/App:** Your app's URL or a landing page. If no website yet, use your App Store/Play Store listing URL or a simple holding page.
- **Business Description:** Describe BexieMart clearly: "BexieMart is a campus marketplace mobile application connecting student vendors with campus customers in Ghana. We facilitate product listings, order management, and payments."

### Step 4.3 — Contact Information

Fill in:
- Business address (physical address in Ghana)
- Support email address (`support@bexiemart.com`)
- Support phone number

### Step 4.4 — Account Information (Bank Settlement Account)

This is the Ghana bank account where Paystack will settle your revenue (platform commission, top-up float, etc.):

- **Bank Name:** Select your business bank (e.g., Ecobank Ghana, GCB, Absa, Stanbic)
- **Account Number:** Your business bank account number
- **Account Name:** Must match the registered business name exactly

> **Note for BexieMart:** This settlement account is where Paystack deposits your platform earnings. It is separate from the vendor withdrawal accounts that your users will add later.

### Step 4.5 — Document Upload

Depending on your business type, you will need:

**For a Registered Company (Ltd.):**
- Certificate of Incorporation (from Registrar General's Department, Ghana)
- Form 3 (Certificate of Commencement of Business) or Form A
- Government-issued ID of a director (Ghana Card, Passport)
- Business bank statement (last 3 months)

**For a Starter Business / Sole Proprietor:**
- Government-issued ID (Ghana Card, Passport, or Voter's ID)
- Business Registration certificate (if available)
- A selfie holding the ID

Upload all documents in PDF or image format (JPG/PNG). Ensure documents are clear, not expired, and fully visible.

### Step 4.6 — Submit & Wait for Approval

1. Review all sections and click **Submit for Review**.
2. Paystack's compliance team will review within 1–3 business days.
3. You will receive an email notification when approved or if additional documents are required.
4. Once approved, the **Live Mode** toggle becomes available and your Live API keys are unlocked.

---

## 5. Webhook Configuration

Webhooks are the backbone of BexieMart's payment reliability. Because Paystack processes payments asynchronously (especially MoMo and bank transfers), your server must listen for events rather than relying solely on the app callback.

### Step 5.1 — What BexieMart Needs to Listen For

| Event | Trigger | BexieMart Action |
|-------|---------|-----------------|
| `charge.success` | Customer successfully pays (card, MoMo, bank) | Credit wallet OR confirm order payment |
| `charge.failed` | Payment attempt failed | Mark transaction failed, notify user |
| `transfer.success` | Vendor withdrawal to bank/MoMo succeeded | Mark withdrawal completed |
| `transfer.failed` | Vendor withdrawal failed | Reverse debit, re-credit vendor wallet, notify vendor |
| `transfer.reversed` | Paystack reversed a transfer | Same as failed — restore wallet balance |

### Step 5.2 — Set Your Webhook URL in the Dashboard

1. In the Paystack Dashboard, go to **Settings → API Keys & Webhooks**.
2. Scroll down to the **Webhooks** section.
3. In the **Test Mode Webhook URL** field, enter your test server webhook URL:
   ```
   https://your-ngrok-url.ngrok.io/webhooks/paystack
   ```
   (During development, use ngrok — see Section 13 for setup.)
4. In the **Live Mode Webhook URL** field, enter your production server URL:
   ```
   https://api.bexiemart.com/webhooks/paystack
   ```
5. Click **Save Changes**.

> **Important:** Paystack cannot call `localhost`. You must expose your local server to the internet during development. Use **ngrok** (free tier works fine for testing).

### Step 5.3 — Webhook Signature Verification (NestJS Code)

Every webhook from Paystack carries an `x-paystack-signature` header — an HMAC-SHA512 hash of the raw request body, signed with your **Secret Key**. You must verify this before processing any event.

```typescript
// src/webhooks/paystack-webhook.controller.ts
import {
  Controller, Post, Headers, Req, Res, HttpCode, RawBodyRequest
} from '@nestjs/common';
import * as crypto from 'crypto';
import { Request, Response } from 'express';
import { PaystackWebhookService } from './paystack-webhook.service';
import { ConfigService } from '@nestjs/config';

@Controller('webhooks/paystack')
export class PaystackWebhookController {
  constructor(
    private readonly webhookService: PaystackWebhookService,
    private readonly config: ConfigService,
  ) {}

  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
    @Headers('x-paystack-signature') signature: string,
  ) {
    // Step 1 — Verify signature BEFORE anything else
    const secret = this.config.get<string>('PAYSTACK_SECRET_KEY');
    const hash = crypto
      .createHmac('sha512', secret)
      .update(req.rawBody) // raw Buffer — requires rawBody enabled in NestJS
      .digest('hex');

    if (hash !== signature) {
      // Reject silently — don't give attackers info
      return res.status(401).send();
    }

    // Step 2 — Return 200 immediately (Paystack retries if it doesn't get 200 fast)
    res.status(200).send();

    // Step 3 — Process event asynchronously
    const event = req.body;
    await this.webhookService.processEvent(event);
  }
}
```

```typescript
// main.ts — Enable rawBody in NestJS for signature verification
const app = await NestFactory.create(AppModule, { rawBody: true });
```

### Step 5.4 — Webhook Event Handler (Service)

```typescript
// src/webhooks/paystack-webhook.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { WalletService } from '../wallet/wallet.service';
import { OrderService } from '../orders/order.service';
import { TransactionService } from '../wallet/transaction.service';

@Injectable()
export class PaystackWebhookService {
  private readonly logger = new Logger(PaystackWebhookService.name);

  constructor(
    private walletService: WalletService,
    private orderService: OrderService,
    private transactionService: TransactionService,
  ) {}

  async processEvent(event: { event: string; data: any }) {
    this.logger.log(`Processing Paystack event: ${event.event}`);

    switch (event.event) {
      case 'charge.success':
        await this.handleChargeSuccess(event.data);
        break;
      case 'transfer.success':
        await this.handleTransferSuccess(event.data);
        break;
      case 'transfer.failed':
      case 'transfer.reversed':
        await this.handleTransferFailed(event.data);
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.event}`);
    }
  }

  private async handleChargeSuccess(data: any) {
    const { reference, metadata, amount } = data;

    // Idempotency — check if already processed
    const existing = await this.transactionService.findByReference(reference);
    if (existing?.status === 'COMPLETED') {
      this.logger.log(`Duplicate event for reference ${reference}. Skipping.`);
      return;
    }

    const amountInGHS = amount / 100; // Paystack amounts are in pesewas

    if (metadata?.type === 'wallet_topup') {
      // Credit wallet
      await this.walletService.creditWallet(
        metadata.userId,
        amountInGHS,
        reference,
        'topup',
      );
    } else if (metadata?.type === 'order_payment') {
      // Confirm order
      await this.orderService.confirmPayment(metadata.orderId, reference);
    }
  }

  private async handleTransferSuccess(data: any) {
    const { reference } = data;
    await this.transactionService.markCompleted(reference);
    // Optionally: send push notification to vendor
  }

  private async handleTransferFailed(data: any) {
    const { reference } = data;
    // Reverse the debit — re-credit vendor wallet
    await this.walletService.reverseWithdrawal(reference);
    // Optionally: send push notification to vendor
  }
}
```

### Step 5.5 — Webhook Retry Behaviour

Paystack retries failed webhook deliveries on this schedule:

- **Live mode:** Every 3 minutes for the first 4 attempts, then hourly for up to 72 hours.
- **Test mode:** Hourly for 10 hours. Request timeout: 30 seconds.

Your webhook endpoint must:
1. Return **200 OK** within 30 seconds.
2. Be idempotent — processing the same event twice must not cause a double-credit.
3. Do heavy processing in a background queue (BullMQ), not inline in the HTTP handler.

---

## 6. Callback URL Configuration

The callback URL is where Paystack redirects the customer's browser after a payment is completed. BexieMart uses a WebView for payments, so the callback URL is used to detect payment completion.

### Step 6.1 — Set Callback URLs in the Dashboard

1. Go to **Settings → API Keys & Webhooks**.
2. Scroll to the **Callback URL** section.
3. Set:
   - **Test Callback URL:** `https://your-ngrok-url.ngrok.io/payments/callback`
   - **Live Callback URL:** `https://api.bexiemart.com/payments/callback`
4. Save changes.

> For BexieMart specifically, you can also override the callback URL per-transaction when calling the Initialize Transaction API. This is more reliable than the dashboard setting.

### Step 6.2 — Handling the Callback in React Native (WebView)

BexieMart uses the existing `PaymentScreen.tsx` WebView wrapper for both order payments and wallet top-ups. The WebView intercepts the callback URL to detect when payment is done.

```typescript
// src/screens/customer/PaymentScreen.tsx
import React, { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import WebView, { WebViewNavigation } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'Payment'>;

const CALLBACK_BASE = 'https://api.bexiemart.com/payments/callback';

export default function PaymentScreen({ route, navigation }: Props) {
  const { authorizationUrl, reference, source } = route.params;
  const [loading, setLoading] = useState(true);

  const handleNavChange = (navState: WebViewNavigation) => {
    const { url } = navState;

    // Detect callback URL — payment is done
    if (url.startsWith(CALLBACK_BASE)) {
      const isSuccess = url.includes('trxref=') && url.includes('reference=');

      if (isSuccess) {
        // Navigate to verification screen
        navigation.replace('PaymentVerify', { reference, source });
      } else {
        navigation.replace('PaymentFailure', { reference, source });
      }
    }
  };

  return (
    <View style={styles.container}>
      {loading && (
        <ActivityIndicator
          size="large"
          color="#004CFF"
          style={StyleSheet.absoluteFill}
        />
      )}
      <WebView
        source={{ uri: authorizationUrl }}
        onNavigationStateChange={handleNavChange}
        onLoadEnd={() => setLoading(false)}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
```

---

## 7. Enabling Transfers (Withdrawals)

Transfers allow BexieMart to send money from the Paystack balance to vendor bank accounts and MoMo wallets.

### Step 7.1 — Understand the Transfer Flow

```
Vendor requests withdrawal
        ↓
BexieMart backend calls Paystack Transfers API
        ↓
Paystack deducts from BexieMart's Paystack Balance
        ↓
Paystack sends funds to vendor's bank/MoMo
        ↓
Paystack sends transfer.success or transfer.failed webhook
        ↓
BexieMart marks transaction complete or reverses wallet debit
```

> **Important:** Transfers draw from your **Paystack Balance** (the float/settlement balance on your Paystack account), not directly from your bank account. You need to maintain sufficient Paystack balance to process vendor withdrawals.

### Step 7.2 — Enable Transfers in Dashboard Preferences

1. Go to **Settings → Preferences**.
2. Find the **Transfers** section.
3. You will see a checkbox: **"Confirm transfers before sending"** (OTP confirmation).
   - **For development:** Uncheck this to disable OTP — transfers will process without manual confirmation. This makes automated testing easier.
   - **For production:** Keep it checked for security, or build the OTP confirmation flow in your app.
4. Save changes.

### Step 7.3 — Verify Account Number Before Creating a Recipient (Ghana)

Before saving a vendor's bank account, verify it exists using Paystack's Resolve Account API.

```typescript
// src/wallet/bank.service.ts

async verifyGhanaBankAccount(
  accountNumber: string,
  bankCode: string,
): Promise<{ accountName: string; accountNumber: string }> {
  const response = await axios.get(
    'https://api.paystack.co/bank/resolve',
    {
      params: { account_number: accountNumber, bank_code: bankCode },
      headers: {
        Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
      },
    },
  );

  if (!response.data.status) {
    throw new BadRequestException(
      'Account could not be verified. Please check the account number and bank.',
    );
  }

  return {
    accountName: response.data.data.account_name,
    accountNumber: response.data.data.account_number,
  };
}
```

> **Note from Paystack docs:** Transfers to the Bank of Ghana are currently not supported. Exclude "Bank of Ghana" from your bank picker dropdown.

### Step 7.4 — Get the List of Ghana Banks

Populate the bank picker dropdown in BexieMart with this API call. Cache the result — it rarely changes.

```typescript
// src/payments/payments.service.ts

async getGhanaBanks(): Promise<{ name: string; code: string; slug: string }[]> {
  // Try cache first (Redis or in-memory)
  const cached = await this.cacheManager.get('ghana_banks');
  if (cached) return cached as any;

  const response = await axios.get('https://api.paystack.co/bank', {
    params: { country: 'ghana', currency: 'GHS', use_cursor: false, perPage: 100 },
    headers: {
      Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
    },
  });

  const banks = response.data.data.map((b: any) => ({
    name: b.name,
    code: b.code,
    slug: b.slug,
  }));

  // Cache for 7 days
  await this.cacheManager.set('ghana_banks', banks, 7 * 24 * 60 * 60 * 1000);

  return banks;
}
```

### Step 7.5 — Create a Transfer Recipient

After verifying the account, create a Paystack Transfer Recipient. Save the `recipient_code` to your database — you'll use it every time the vendor requests a withdrawal.

```typescript
// src/wallet/bank.service.ts

async createTransferRecipient(
  accountName: string,
  accountNumber: string,
  bankCode: string,
): Promise<string> {  // returns recipient_code
  const response = await axios.post(
    'https://api.paystack.co/transferrecipient',
    {
      type: 'ghipss',         // Use 'ghipss' for Ghana bank accounts
      name: accountName,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: 'GHS',
    },
    {
      headers: {
        Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.data.status) {
    throw new BadRequestException('Failed to create transfer recipient');
  }

  return response.data.data.recipient_code;
  // Example: "RCP_abc123xyz789"
  // Save this to BankAccount.paystackRecipientCode in your DB
}
```

> **Ghana-specific:** Use `type: 'ghipss'` for Ghana bank accounts (not `nuban` which is for Nigeria). This was added by Paystack specifically to support Ghanaian merchants.

### Step 7.6 — Initiate a Transfer (Vendor Withdrawal to Bank)

```typescript
// src/wallet/withdrawal.service.ts

async withdrawToBank(
  walletId: string,
  amount: number,
  bankAccountId: string,
  pin: string,
): Promise<{ reference: string }> {
  // 1. Verify PIN
  await this.pinService.verifyPin(walletId, pin);

  // 2. Fetch the bank account + recipient code
  const bankAccount = await this.bankAccountRepo.findOne({
    where: { id: bankAccountId, wallet: { id: walletId } },
  });
  if (!bankAccount) throw new NotFoundException('Bank account not found');

  const fee = await this.platformConfig.getWithdrawalFee();
  const totalDebit = amount + fee;

  // 3. Atomic debit — wallet balance reduced immediately
  const reference = `BXM_WD_${uuidv4()}`;
  await this.walletService.debitWallet(walletId, totalDebit, reference, 'withdrawal');

  try {
    // 4. Call Paystack Transfers API
    const response = await axios.post(
      'https://api.paystack.co/transfer',
      {
        source: 'balance',
        reason: 'BexieMart wallet withdrawal',
        amount: amount * 100,         // convert to pesewas
        recipient: bankAccount.paystackRecipientCode,
        reference,                    // unique per transfer — enables idempotency on retry
        currency: 'GHS',
      },
      {
        headers: {
          Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.data.status) {
      throw new Error('Transfer initiation failed');
    }

    // Transfer is 'pending' — final status comes via webhook
    return { reference };

  } catch (error) {
    // Reverse the debit if the API call itself failed
    await this.walletService.reverseWithdrawal(reference);
    throw new InternalServerErrorException('Withdrawal could not be initiated. Please try again.');
  }
}
```

---

## 8. Mobile Money Setup (Ghana — MoMo Collections)

Paystack supports Mobile Money payments for Ghana via their Charge API. This covers both MoMo top-ups (customer funds wallet via MoMo) and MoMo withdrawals (vendor receives withdrawal to MoMo number).

### Step 8.1 — MoMo Collection (Customer Top-Up via MoMo)

When a customer wants to fund their wallet using MTN MoMo, BexieMart uses Paystack's Charge API with the `mobile_money` object.

```typescript
// src/wallet/topup.service.ts

async initiateMomoTopUp(
  userId: string,
  amount: number,
  phoneNumber: string,
): Promise<{ reference: string; displayText: string }> {
  const reference = `BXM_TU_MOMO_${uuidv4()}`;
  const user = await this.userRepo.findOne({ where: { id: userId } });

  // Create pending transaction first
  await this.transactionService.createPending({
    type: 'TOPUP',
    amount,
    reference,
    userId,
    metadata: { type: 'wallet_topup', channel: 'momo' },
  });

  const response = await axios.post(
    'https://api.paystack.co/charge',
    {
      email: user.email,
      amount: amount * 100,        // pesewas
      currency: 'GHS',
      mobile_money: {
        phone: phoneNumber,        // e.g. "0241234567"
        provider: 'mtn',          // Ghana MoMo provider code
      },
      reference,
      metadata: {
        type: 'wallet_topup',
        userId,
        custom_fields: [
          { display_name: 'Purpose', variable_name: 'purpose', value: 'Wallet Top-Up' },
        ],
      },
    },
    {
      headers: {
        Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
        'Content-Type': 'application/json',
      },
    },
  );

  const data = response.data.data;

  // data.status = 'pay_offline' for MoMo — customer must approve on phone
  return {
    reference,
    displayText: data.display_text || 'Please approve the payment prompt on your phone.',
  };
}
```

> The response `data.status = 'pay_offline'` means the customer will receive a push prompt on their phone to approve. BexieMart should display: "Check your phone for an MTN MoMo prompt." The final result comes via `charge.success` webhook.

### Step 8.2 — MoMo Provider Codes (Ghana)

| Provider | Code (in API) | Prefixes |
|----------|--------------|----------|
| MTN Mobile Money | `mtn` | 024, 054, 055, 059 |
| Vodafone Cash | `vod` | 020, 050 |
| AirtelTigo Money | `tgo` | 027, 057, 026, 056 |

For v1.1 BexieMart supports MTN only. Expand to `vod` and `tgo` in v2 by adding the additional provider codes.

### Step 8.3 — MoMo Withdrawal (Vendor to MTN Wallet — Paystack Transfer)

Paystack supports transfers to Ghana Mobile Money wallets. The recipient type for MoMo is `mobile_money` (not `ghipss`).

```typescript
// src/wallet/bank.service.ts

async createMomoTransferRecipient(
  phoneNumber: string,
  accountName: string,
  provider: 'mtn' | 'vod' | 'tgo' = 'mtn',
): Promise<string> {
  const response = await axios.post(
    'https://api.paystack.co/transferrecipient',
    {
      type: 'mobile_money',
      name: accountName,
      account_number: phoneNumber,   // phone number is the "account number"
      bank_code: provider,           // 'mtn', 'vod', or 'tgo'
      currency: 'GHS',
    },
    {
      headers: {
        Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
        'Content-Type': 'application/json',
      },
    },
  );

  return response.data.data.recipient_code;
}
```

Once you have the `recipient_code` for a MoMo number, the transfer initiation is **identical** to bank transfers — the same `POST /transfer` endpoint, same `source: 'balance'`, same webhook events.

---

## 9. Team & Permissions Setup

Multiple developers need dashboard access. Paystack supports role-based team members.

### Step 9.1 — Add Team Members

1. Go to **Settings → Team Members**.
2. Click **Invite Member**.
3. Enter the team member's email address.
4. Assign a role:

| Role | What They Can Do | Recommended For |
|------|-----------------|-----------------|
| **Admin** | Full access — keys, compliance, transfers, settings | Lead developer, CTO |
| **Developer** | API keys view, webhook config, test transactions | Backend devs (Dev A, Dev C) |
| **Support** | View transactions, issue refunds, view customers | Customer support staff |
| **Finance** | View balance, initiate transfers, export CSV | Finance team |
| **Viewer** | Read-only — view transactions only | Stakeholders |

5. The invitee receives an email with a link to set up their account and join the team.

### Step 9.2 — Control Transfer Permissions

Only specific team members should be able to initiate transfers (prevent accidental vendor withdrawal triggers):

1. Go to **Settings → Preferences → Transfers**.
2. Enable **"Restrict transfers to specific team members"**.
3. Select only Admin and Finance roles as allowed to initiate transfers from the dashboard.

> Note: API-initiated transfers (from your NestJS backend) bypass this restriction — they are authenticated by the secret key. Dashboard restrictions apply only to manual dashboard-initiated transfers.

---

## 10. IP Whitelisting

For extra security in production, whitelist your server's IP addresses so Paystack only accepts API calls from known locations.

### Step 10.1 — Whitelist Your Server IPs

1. Go to **Settings → API Keys & Webhooks**.
2. Scroll to **IP Whitelist**.
3. Add your production server IP addresses (up to 10 per environment).
4. Click **Add IP**.

> Only valid public IPv4 addresses are accepted. IPv6, private IPs (10.x.x.x, 192.168.x.x), and CIDR ranges are not supported.

### Step 10.2 — Whitelist Paystack's Webhook IPs (On Your Server)

Paystack sends webhooks from a fixed set of IP addresses. Whitelist these on your server firewall / nginx / load balancer to block spoofed webhook calls:

```nginx
# nginx — only accept POST /webhooks/paystack from Paystack IPs
location /webhooks/paystack {
  allow 52.31.139.75;
  allow 52.49.173.169;
  allow 52.214.14.220;
  deny all;
  proxy_pass http://localhost:3000;
}
```

> Check [https://paystack.com/docs/payments/webhooks/](https://paystack.com/docs/payments/webhooks/) for the current list of Paystack IPs — they can change. Both test and live environments use the same IPs.

---

## 11. NestJS Backend Integration

### Step 11.1 — Install Dependencies

```bash
npm install axios @nestjs/config
```

Axios is already in most NestJS setups. No official Paystack Node SDK is needed — the REST API is straightforward enough to call directly with Axios.

### Step 11.2 — Environment Variables (Backend)

Create or update your `.env` file in the NestJS project root:

```env
# .env (NestJS backend — never commit to Git)

# Paystack
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYSTACK_WEBHOOK_SECRET=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # same as SECRET_KEY — used for HMAC verification

# App URLs
APP_URL=https://api.bexiemart.com
PAYSTACK_CALLBACK_URL=https://api.bexiemart.com/payments/callback
PAYSTACK_WALLET_TOPUP_CALLBACK_URL=https://api.bexiemart.com/wallet/topup/callback
```

### Step 11.3 — Paystack Service (Reusable Module)

```typescript
// src/paystack/paystack.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class PaystackService {
  private readonly client: AxiosInstance;

  constructor(private config: ConfigService) {
    this.client = axios.create({
      baseURL: 'https://api.paystack.co',
      headers: {
        Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
        'Content-Type': 'application/json',
      },
    });
  }

  // ── Transactions ──────────────────────────────────────

  async initializeTransaction(params: {
    email: string;
    amount: number;       // in GHS — we convert to pesewas here
    reference: string;
    callbackUrl: string;
    metadata?: object;
    channels?: string[];
  }) {
    const response = await this.client.post('/transaction/initialize', {
      email: params.email,
      amount: Math.round(params.amount * 100),  // GHS → pesewas
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
      channels: params.channels ?? ['card', 'bank', 'mobile_money'],
      currency: 'GHS',
    });
    return response.data.data as { authorization_url: string; reference: string; access_code: string };
  }

  async verifyTransaction(reference: string) {
    const response = await this.client.get(`/transaction/verify/${reference}`);
    return response.data.data as {
      status: string;       // 'success' | 'failed' | 'abandoned'
      amount: number;       // in pesewas
      reference: string;
      metadata: any;
    };
  }

  // ── Transfers ──────────────────────────────────────────

  async resolveAccountNumber(accountNumber: string, bankCode: string) {
    const response = await this.client.get('/bank/resolve', {
      params: { account_number: accountNumber, bank_code: bankCode },
    });
    return response.data.data as { account_name: string; account_number: string };
  }

  async createTransferRecipient(params: {
    type: 'ghipss' | 'mobile_money';
    name: string;
    accountNumber: string;
    bankCode: string;
  }) {
    const response = await this.client.post('/transferrecipient', {
      type: params.type,
      name: params.name,
      account_number: params.accountNumber,
      bank_code: params.bankCode,
      currency: 'GHS',
    });
    return response.data.data.recipient_code as string;
  }

  async initiateTransfer(params: {
    amount: number;           // in GHS — we convert to pesewas
    recipientCode: string;
    reference: string;
    reason?: string;
  }) {
    const response = await this.client.post('/transfer', {
      source: 'balance',
      amount: Math.round(params.amount * 100),
      recipient: params.recipientCode,
      reference: params.reference,
      reason: params.reason ?? 'BexieMart withdrawal',
      currency: 'GHS',
    });
    return response.data.data as {
      transfer_code: string;
      status: string;         // 'pending' in most cases — final via webhook
    };
  }

  async verifyTransfer(reference: string) {
    const response = await this.client.get(`/transfer/verify/${reference}`);
    return response.data.data;
  }

  // ── Mobile Money Charge ────────────────────────────────

  async chargeMobileMoney(params: {
    email: string;
    amount: number;    // in GHS
    phone: string;
    provider: 'mtn' | 'vod' | 'tgo';
    reference: string;
    metadata?: object;
  }) {
    const response = await this.client.post('/charge', {
      email: params.email,
      amount: Math.round(params.amount * 100),
      currency: 'GHS',
      mobile_money: { phone: params.phone, provider: params.provider },
      reference: params.reference,
      metadata: params.metadata,
    });
    return response.data.data as {
      status: string;        // 'pay_offline' for MoMo — customer approves on phone
      display_text: string;
      reference: string;
    };
  }

  // ── Banks List ─────────────────────────────────────────

  async listGhanaBanks() {
    const response = await this.client.get('/bank', {
      params: { country: 'ghana', currency: 'GHS', perPage: 100 },
    });
    return response.data.data as { name: string; code: string; slug: string }[];
  }
}
```

### Step 11.4 — Transaction Initialize Endpoint

```typescript
// src/payments/payments.controller.ts (additions for wallet top-up)

@Post('wallet/topup/initialize')
@UseGuards(JwtAuthGuard)
async initializeWalletTopUp(
  @Req() req,
  @Body() body: { amount: number; channel: 'card' | 'mobile_money' },
) {
  const user = req.user;
  const reference = `BXM_TU_${uuidv4().replace(/-/g, '').slice(0, 20)}`;

  // Create pending transaction in DB
  await this.transactionService.createPending({
    userId: user.id,
    type: 'TOPUP',
    amount: body.amount,
    reference,
    metadata: { type: 'wallet_topup', channel: body.channel },
  });

  if (body.channel === 'mobile_money') {
    // Handled separately in /wallet/topup/momo
    throw new BadRequestException('Use /wallet/topup/momo for MoMo top-ups');
  }

  const result = await this.paystackService.initializeTransaction({
    email: user.email,
    amount: body.amount,
    reference,
    callbackUrl: `${this.config.get('APP_URL')}/wallet/topup/callback`,
    metadata: { type: 'wallet_topup', userId: user.id },
    channels: ['card', 'bank'],
  });

  return { authorizationUrl: result.authorization_url, reference };
}

@Get('wallet/topup/verify/:reference')
@UseGuards(JwtAuthGuard)
async verifyWalletTopUp(
  @Req() req,
  @Param('reference') reference: string,
) {
  const transaction = await this.paystackService.verifyTransaction(reference);

  if (transaction.status !== 'success') {
    throw new BadRequestException('Payment not successful');
  }

  // Idempotency check
  const existing = await this.transactionService.findByReference(reference);
  if (existing?.status === 'COMPLETED') {
    const wallet = await this.walletService.getWallet(req.user.id);
    return { balance: wallet.balance, alreadyProcessed: true };
  }

  // Credit wallet
  const wallet = await this.walletService.creditWallet(
    req.user.id,
    transaction.amount / 100,
    reference,
    'topup',
  );

  return { balance: wallet.balance };
}
```

---

## 12. React Native Integration

### Step 12.1 — Environment Variables (Expo / React Native)

In your React Native Expo project, create or update `.env`:

```env
# .env (React Native — EXPO_PUBLIC_ prefix makes it safe to expose)
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_API_BASE_URL=https://api.bexiemart.com/api/v1
```

> Never put `sk_test_` or `sk_live_` in the React Native `.env`. Secret keys go only in the NestJS backend.

### Step 12.2 — Top-Up Flow (Paystack via WebView)

The safest, most reliable cross-platform approach for Expo. No native SDK needed.

```typescript
// src/screens/customer/wallet/TopUpScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { walletApi } from '../../../api/wallet';

const PRESET_AMOUNTS = [20, 50, 100, 200, 500];

export default function TopUpScreen() {
  const [amount, setAmount] = useState<number | null>(null);
  const [channel, setChannel] = useState<'card' | 'mobile_money'>('card');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();

  const handleContinue = async () => {
    if (!amount || amount < 5) {
      Alert.alert('Minimum top-up is GHS 5.00');
      return;
    }

    setLoading(true);
    try {
      if (channel === 'card') {
        const { authorizationUrl, reference } = await walletApi.initializeTopUp(amount, 'card');

        // Navigate to WebView (reuse existing PaymentScreen)
        navigation.navigate('Payment', {
          authorizationUrl,
          reference,
          source: 'wallet_topup',
        });
      } else {
        // MoMo — navigate to MoMo screen
        navigation.navigate('TopUpMomo', { amount });
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not initialize payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Money to Wallet</Text>

      {/* Preset Amounts */}
      <View style={styles.presets}>
        {PRESET_AMOUNTS.map((preset) => (
          <TouchableOpacity
            key={preset}
            style={[styles.presetChip, amount === preset && styles.presetChipActive]}
            onPress={() => setAmount(preset)}
          >
            <Text style={[styles.presetText, amount === preset && styles.presetTextActive]}>
              GHS {preset}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Channel Selection */}
      <Text style={styles.label}>Payment Method</Text>
      <TouchableOpacity
        style={[styles.channelCard, channel === 'card' && styles.channelCardActive]}
        onPress={() => setChannel('card')}
      >
        <Text style={styles.channelTitle}>💳  Card / Bank Transfer</Text>
        <Text style={styles.channelSub}>Pay securely via Paystack</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.channelCard, channel === 'mobile_money' && styles.channelCardActive]}
        onPress={() => setChannel('mobile_money')}
      >
        <Text style={styles.channelTitle}>📱  MTN Mobile Money</Text>
        <Text style={styles.channelSub}>Get a MoMo prompt on your phone</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, (!amount || loading) && styles.btnDisabled]}
        onPress={handleContinue}
        disabled={!amount || loading}
      >
        <Text style={styles.btnText}>{loading ? 'Please wait...' : 'Continue'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 20, fontFamily: 'Raleway_700Bold', marginBottom: 24 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  presetChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: '#E4E7EC',
  },
  presetChipActive: { backgroundColor: '#004CFF', borderColor: '#004CFF' },
  presetText: { fontFamily: 'Nunito_600SemiBold', color: '#111322' },
  presetTextActive: { color: '#fff' },
  label: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#5F6C7B', marginBottom: 8 },
  channelCard: {
    padding: 16, borderRadius: 12, borderWidth: 1,
    borderColor: '#E4E7EC', marginBottom: 12,
  },
  channelCardActive: { borderColor: '#004CFF', backgroundColor: '#EEF3FF' },
  channelTitle: { fontFamily: 'Nunito_700Bold', fontSize: 16 },
  channelSub: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: '#5F6C7B', marginTop: 2 },
  btn: {
    backgroundColor: '#004CFF', borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 24,
  },
  btnDisabled: { backgroundColor: '#B0C4FF' },
  btnText: { color: '#fff', fontFamily: 'Raleway_700Bold', fontSize: 16 },
});
```

### Step 12.3 — Payment Verify Screen (After WebView Callback)

```typescript
// src/screens/customer/PaymentVerifyScreen.tsx
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { walletApi } from '../../api/wallet';
import { useWalletStore } from '../../stores/walletStore';
import { useQueryClient } from '@tanstack/react-query';
import { WALLET_KEYS } from '../../hooks/useWallet';

export default function PaymentVerifyScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { reference, source } = route.params;
  const { setBalance } = useWalletStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      if (source === 'wallet_topup') {
        const result = await walletApi.verifyTopUp(reference);
        setBalance(result.balance);
        queryClient.invalidateQueries({ queryKey: WALLET_KEYS.wallet });
        navigation.replace('TopUpSuccess', { balance: result.balance });
      } else {
        // Order payment verification
        navigation.replace('OrderConfirmation', { reference });
      }
    } catch {
      navigation.replace('PaymentFailure', { reference, source });
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#004CFF" />
      <Text style={styles.text}>Confirming your payment…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { marginTop: 16, fontFamily: 'Nunito_400Regular', color: '#5F6C7B' },
});
```

---

## 13. Testing with Paystack Sandbox

### Step 13.1 — Expose Local Server with ngrok

Paystack cannot call `localhost`. During development, use ngrok to create a public tunnel.

```bash
# Install ngrok (macOS)
brew install ngrok

# Or download from https://ngrok.com

# Authenticate (one-time — create free account at ngrok.com)
ngrok authtoken YOUR_NGROK_TOKEN

# Start tunnel (replace 3000 with your NestJS port)
ngrok http 3000
```

ngrok will output something like:
```
Forwarding   https://abc123.ngrok.io → http://localhost:3000
```

Use `https://abc123.ngrok.io/webhooks/paystack` as your **Test Webhook URL** in the Paystack dashboard (Settings → API Keys & Webhooks).

> **Important:** Each time you restart ngrok, the URL changes. Update the dashboard each time. To get a stable URL, use ngrok's paid plan or set a static subdomain.

### Step 13.2 — Paystack Test Cards

Use these card numbers in the Paystack payment form during testing. No real money is charged.

| Scenario | Card Number | Expiry | CVV | PIN | OTP |
|----------|-------------|--------|-----|-----|-----|
| **Successful payment** | `4084084084084081` | Any future date | Any 3 digits | `0000` | `123456` |
| **Failed payment** | `4084084084084084` | Any future date | Any | — | — |
| **Declined (insufficient funds)** | `4000000000000002` | Any future date | Any | — | — |
| **3D Secure success** | `5399 8383 8383 8381` | Any future date | Any | `0000` | `123456` |

### Step 13.3 — Test Mobile Money (Ghana)

In test mode, initiate a MoMo charge and use these test credentials:

```
Phone: 0551234987   (test MTN Ghana number)
OTP: 123456         (when prompted)
```

The charge will succeed without any real MoMo interaction.

### Step 13.4 — Simulating Webhooks Manually

Use the Paystack CLI or cURL to send a test webhook to your local server for testing without making real payments:

```bash
# Simulate a charge.success webhook
curl -X POST https://abc123.ngrok.io/webhooks/paystack \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: <compute_hmac_below>" \
  -d '{
    "event": "charge.success",
    "data": {
      "reference": "BXM_TU_test123",
      "amount": 10000,
      "status": "success",
      "metadata": {
        "type": "wallet_topup",
        "userId": "your-test-user-id"
      }
    }
  }'
```

To compute the correct HMAC signature for testing:

```typescript
// Generate test HMAC (run in a Node.js script)
const crypto = require('crypto');
const body = JSON.stringify({ event: 'charge.success', data: { /* ... */ } });
const secret = 'sk_test_your_key_here';
const sig = crypto.createHmac('sha512', secret).update(body).digest('hex');
console.log(sig); // Use this as x-paystack-signature header value
```

### Step 13.5 — Test Transfers (Withdrawals)

In test mode, all transfers return `success` immediately — there is no real processing. This means:

1. Call `POST /transfer` with a test recipient code.
2. The response will include `status: 'success'`.
3. Paystack will **not** send a `transfer.success` webhook in test mode automatically — you may need to trigger it manually using cURL (same as Step 13.4 but with `transfer.success` event).
4. Always test the webhook handler independently to ensure your reversal logic works too.

---

## 14. Going Live — Pre-Launch Checklist

Complete every item on this list before switching to Live Mode.

### 14.1 — Paystack Dashboard Checklist

- [ ] Compliance forms fully submitted and **approved** by Paystack
- [ ] Live Secret Key and Live Public Key copied to production `.env`
- [ ] Live Webhook URL set to `https://api.bexiemart.com/webhooks/paystack`
- [ ] Live Callback URL set to `https://api.bexiemart.com/payments/callback`
- [ ] Test Webhook URL updated to staging server (if staging exists)
- [ ] Transfer OTP preferences reviewed (enabled or disabled as per business decision)
- [ ] Settlement bank account verified and receiving test settlements
- [ ] Team members added with correct roles

### 14.2 — Backend Checklist

- [ ] `PAYSTACK_SECRET_KEY` in production is the **Live** key (starts with `sk_live_`)
- [ ] `PAYSTACK_PUBLIC_KEY` in production is the **Live** key (starts with `pk_live_`)
- [ ] Webhook signature verification enabled and tested
- [ ] Idempotency checks in place — no double-credits possible
- [ ] All amounts correctly converted: GHS × 100 = pesewas (Paystack uses smallest currency unit)
- [ ] Transfer recipient type is `ghipss` for Ghana bank accounts
- [ ] Transfer recipient type is `mobile_money` for MoMo wallets
- [ ] Error handling covers: Paystack 4xx errors, 5xx errors, timeout, network failure
- [ ] Reversal logic tested: withdrawal fails → wallet re-credited → user notified
- [ ] Raw body parsing enabled in NestJS (`rawBody: true` in NestFactory.create)
- [ ] Paystack webhook IPs whitelisted on server firewall
- [ ] No `sk_live_` key exposed in logs, error messages, or API responses

### 14.3 — React Native Checklist

- [ ] `EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY` is the **Live** public key
- [ ] Payment WebView callback URL matches what is set on Paystack dashboard
- [ ] All test card numbers removed from any UI hints or autofill
- [ ] Payment flow tested on real physical iOS and Android devices
- [ ] Deep link / URL scheme configured for WebView callback interception
- [ ] Loading states and error messages tested for slow networks

### 14.4 — Final End-to-End Test (Live Mode — Small Amounts)

After switching to Live Mode, make real small-amount test transactions:

1. Top-up wallet with **GHS 5** using a real card
2. Verify wallet balance updates
3. Make a purchase using wallet balance
4. Confirm vendor earnings credited
5. Withdraw **GHS 10** to a real bank account and confirm receipt
6. Withdraw **GHS 10** to a real MTN MoMo number and confirm receipt

---

## 15. Environment Variables Reference

### NestJS Backend (`.env`)

```env
# ─────────────────────────────────────────────
# Paystack — Test Environment
# ─────────────────────────────────────────────
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ─────────────────────────────────────────────
# Paystack — Live Environment (production only)
# ─────────────────────────────────────────────
# PAYSTACK_SECRET_KEY=<your_live_secret_key>
# PAYSTACK_PUBLIC_KEY=<your_live_public_key>

# ─────────────────────────────────────────────
# URLs
# ─────────────────────────────────────────────
APP_URL=https://api.bexiemart.com
PAYSTACK_CALLBACK_URL=${APP_URL}/payments/callback
PAYSTACK_WALLET_TOPUP_CALLBACK_URL=${APP_URL}/wallet/topup/callback
PAYSTACK_WEBHOOK_URL=${APP_URL}/webhooks/paystack
```

### React Native Expo (`.env`)

```env
# ─────────────────────────────────────────────
# Paystack — Test Environment
# EXPO_PUBLIC_ prefix makes these safe to include in the bundle
# ─────────────────────────────────────────────
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_API_BASE_URL=https://api.bexiemart.com/api/v1

# ─────────────────────────────────────────────
# Paystack — Live Environment
# ─────────────────────────────────────────────
# EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=<your_live_public_key>
```

### Access in Code

```typescript
// NestJS — via ConfigService
const secretKey = this.config.get<string>('PAYSTACK_SECRET_KEY');

// React Native — via process.env (Expo handles substitution at build time)
const publicKey = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY;
```

---

## 16. Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `HTTP 401: Unauthorized` | Wrong or missing secret key | Check `PAYSTACK_SECRET_KEY` in `.env`. Confirm it starts with `sk_test_` (test) or `sk_live_` (live). Ensure `Authorization: Bearer ${key}` header format. |
| `HTTP 400: Invalid account number` | Bank account number format wrong | Ghana account numbers are 10–16 digits. Do not include spaces or dashes. Call `/bank/resolve` before saving. |
| `Webhook 401 / signature mismatch` | Signing with wrong key or using request body string vs Buffer | Use `req.rawBody` (Buffer) in the HMAC computation, not `JSON.stringify(req.body)`. Enable `rawBody: true` in NestJS. |
| `Transfer: insufficient balance` | Your Paystack Balance is too low | Top up your Paystack balance or enable Manual Payouts to hold funds in balance instead of auto-settling. |
| `MoMo charge status: pay_offline — never resolves` | MoMo test number not triggered | In test mode, you must manually trigger the `charge.success` webhook via cURL. |
| `ngrok: tunnel not found` | ngrok session expired (free tier: 2hrs) | Restart ngrok (`ngrok http 3000`) and update the webhook URL in dashboard. |
| `Amount too small` | Amount sent in GHS instead of pesewas | Paystack amounts are always in the smallest currency unit. Multiply GHS × 100 before sending. E.g., GHS 10 = `1000` in the API. |
| `recipient_code invalid` | Using a test recipient code in live mode | Recipient codes are environment-specific. Re-create transfer recipients in live mode. |
| `Double credit on retry` | No idempotency check before crediting | Always check if `transaction.reference` already has `status = COMPLETED` before crediting. Add a `UNIQUE` DB constraint on `reference`. |
| `Webhook not received` | Server returned non-200 or URL is wrong | Ensure webhook endpoint returns `200` immediately. Check ngrok/server is running. Check Paystack dashboard for delivery logs under Settings → API Keys & Webhooks → Webhook Logs. |
| `Transfers to Bank of Ghana not supported` | Bank of Ghana excluded | Filter out "Bank of Ghana" from your bank list. Use Paystack's `/bank` API with `country=ghana` and remove the Bank of Ghana entry. |
| `Error: ghipss type not found` | Using wrong recipient type for Ghana | Ghana bank transfers use `type: 'ghipss'`. Nigeria uses `type: 'nuban'`. Do not mix them. |

---

*Manual authored for BexieMart Campus Marketplace. May 14, 2026.*
*References: Paystack Developer Documentation (paystack.com/docs) · Paystack Support (support.paystack.com)*
*Stack: NestJS · Prisma · React Native (Expo) · TypeScript*
