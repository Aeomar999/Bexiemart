# Production Services Setup Guide

To ensure BexieMart is fully production-ready without using placeholders or mocks, you need to configure three external services. This guide will walk you through setting up **Resend** (for email verification), **Sentry** (for crash reporting), and **PostHog** (for feature flags).

Once you have completed these steps, add the resulting API keys to your environment files, and we can proceed with the implementation.

---

## 1. Email Delivery (Resend)

We will use Resend to send real verification emails to users. It integrates perfectly with Node.js and Better Auth.

### Steps to Setup:
1. Go to [Resend.com](https://resend.com/) and create a free account.
2. Navigate to **API Keys** in the dashboard and click **Create API Key**.
3. Give it a name (e.g., "BexieMart Production") with "Full Access" permissions.
4. Copy the generated API key.
5. *(Optional but recommended)* Go to **Domains** and verify your domain (e.g., `bexiemart.com`) so emails don't end up in spam. If you don't have a domain yet, you can use Resend's testing domain (sends only to your registered email address).

### Environment Variables
Add the following to `apps/server/.env`:
```env
# Server .env
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM="BexieMart <onboarding@resend.dev>" # Change to your verified domain if available
```

---

## 2. Error Monitoring (Sentry)

Sentry will catch unhandled exceptions, crashes, and performance issues on both the NestJS server and the React Native mobile app.

### Steps to Setup:
1. Go to [Sentry.io](https://sentry.io/) and create an account.
2. Create a new **Project** for the Backend:
   - Select **Node.js** (or Express/NestJS if available) as the platform.
   - Name it `bexiemart-server`.
   - Once created, copy the `DSN` string provided in the setup instructions.
3. Create a second **Project** for the Mobile App:
   - Select **React Native** as the platform.
   - Name it `bexiemart-mobile`.
   - Copy the `DSN` string for the mobile app.
4. *(Optional)* Generate an Auth Token in Sentry's Organization Settings for uploading source maps during production builds.

### Environment Variables
Add the server DSN to `apps/server/.env`:
```env
# Server .env
SENTRY_DSN=https://your_server_dsn_here@sentry.io/123456
```

Add the mobile DSN to `apps/mobile/.env`:
```env
# Mobile .env
EXPO_PUBLIC_SENTRY_DSN=https://your_mobile_dsn_here@sentry.io/654321
```

---

## 3. Feature Flags & Analytics (PostHog)

PostHog will be used to manage Feature Flags (e.g., turning Flash Sales on/off gradually) without redeploying the app.

### Steps to Setup:
1. Go to [PostHog.com](https://posthog.com/) and create a free account.
2. Once logged in, go to **Project Settings**.
3. Under the **Project API Key** section, copy your `Project API Key` (it usually starts with `phc_`).
4. Note your **Instance Address** (e.g., `https://us.i.posthog.com` or `https://eu.i.posthog.com`).
5. To create a feature flag:
   - Go to **Feature Flags** in the left sidebar.
   - Click **New Feature Flag**.
   - Key: `flash-sales-active`
   - Rollout: 100% (or specific users)
   - Save the flag.

### Environment Variables
Add the following to `apps/server/.env`:
```env
# Server .env
POSTHOG_API_KEY=phc_your_api_key_here
POSTHOG_HOST=https://us.i.posthog.com
```

Add the following to `apps/mobile/.env` (if you want frontend feature flags too):
```env
# Mobile .env
EXPO_PUBLIC_POSTHOG_API_KEY=phc_your_api_key_here
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

---

## Next Steps

Once you have created these accounts and obtained the keys, please:
1. Create/Update your `.env` files with the actual values.
2. Let me know when you are done.

I will then execute the implementation plan integrating the live, production-ready SDKs for these services instead of mocks!
