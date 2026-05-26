# BexieMart Re-Audit & Campus E-Commerce Strategy

> **Scope:** Re-evaluating BexieMart's documentation and codebase against the specific use case of a Ghanaian University/School E-Commerce platform.
> **Date:** May 2026

---

## 1. Executive Summary

BexieMart is transitioning from a prototype to a production-ready React Native application. However, current documentation (PRD) and architecture are built around a generalized e-commerce model. Given that BexieMart is specifically geared towards **Ghanaian schools and universities**, the platform must adapt to the unique realities of campus commerce: high-density student housing (hostels/halls), trust issues between student buyers/sellers, heavy reliance on Mobile Money (MoMo), and a high volume of "pre-loved" (used) item sales.

This document outlines the gaps in the current implementation and proposes tailored features and logical improvements to ensure product-market fit.

---

## 2. Codebase & Documentation Audit (Current State)

Based on a review of `bexiemart-rebuild_PRD.md` and `codebase_audit.md`:

### 🚨 Critical Deficiencies in Current Logic
1. **Stubbed Backend & Zero Auth Guards:** The API currently returns fake JSON for most endpoints (except Products), and there are no authentication guards. Anyone can hit endpoints to modify data.
2. **Missing Escrow/Trust Logic:** Paystack is integrated, but there is no documentation on how vendor payouts work. In a campus environment, paying upfront without an escrow system leads to high scam rates.
3. **Generic Delivery Logic:** The PRD mentions "Delivery Option" but lacks the granularity needed for campus logistics (e.g., specific halls, lecture blocks, off-campus hostels).
4. **Data Integrity:** Financials are stored as `Float` instead of `Decimal`/integer cents.
5. **No Verification System:** There is no documented logic for verifying that a user or vendor is actually a student at the targeted university.

---

## 3. Suggested Features for Ghanaian Campus Commerce

To succeed in a Ghanaian university environment (e.g., KNUST, UG, UCC, Ashesi), BexieMart must implement the following tailored features:

### A. Campus-Specific Logistics & Delivery
*   **Hostel/Hall Drop-offs:** Replace generic addresses with specific campus zones. Dropdown menus should list known traditional halls (e.g., Legon Hall, Sarbah Hall) and popular off-campus hostels (e.g., Evandy, Pentagon, Bani).
*   **Meetup / Pickup Options:** Students often prefer to meet at neutral locations (e.g., "Bush Canteen", "Night Market", "Library"). Add a "Campus Meetup" delivery option with predefined safe zones.
*   **Delivery Time Indicators:** Highlight "Instant Campus Delivery" (under 30 mins) vs "Next Day Delivery" to match student urgency.

### B. Payment & Trust Mechanisms (Crucial)
*   **Mobile Money (MoMo) First:** Paystack handles MoMo, but the UI must explicitly highlight MTN MoMo, Telecel Cash, and ATMoney over card payments, as >90% of students will use MoMo.
*   **Escrow System:** When a student pays via MoMo, BexieMart must hold the funds in escrow. The funds are only released to the vendor's wallet when the buyer clicks "Item Received & Verified". This eliminates campus scams.
*   **Haggling / "Make an Offer":** Campus commerce is highly negotiable. Introduce a "Make an Offer" button alongside "Add to Cart" that allows students to negotiate prices directly in the app.

### C. Student Verification & Identity
*   **.edu.gh Email or Student ID Verification:** To build trust, vendors should be able to get a "Verified Student" badge by uploading their student ID or verifying their university email.
*   **Campus Siloing:** Users should select their campus during onboarding so they only see products available at their specific university (cross-campus delivery is rarely viable for student commerce).

### D. Tailored Product Categories
*   **Pre-Loved / Thrift (Obroni Wawu):** A dedicated category for used items (textbooks, mini-fridges, fans, microwaves, clothes) as students frequently buy/sell items when moving in/out of hostels.
*   **Food & Late Night Snacks:** Students study late. A specific tag/filter for vendors who are currently "Open Now" for late-night food deliveries.
*   **Services:** Hair braiding, barbering, laptop repair, and tutoring are massive campus micro-economies. The platform should support "Service" listings, not just physical products.

---

## 4. Planned Improvements to Platform Logic

### Backend & API Improvements
1. **Implement Escrow Ledger:** 
   * Update the Prisma schema to include an `Escrow` model. 
   * When Paystack confirms payment, update order status to `PAID_IN_ESCROW`.
   * Add an endpoint `PATCH /orders/:id/confirm-receipt` for the buyer. This triggers the movement of funds from Escrow to the `VendorWallet`.
2. **Authentication Middleware:** 
   * Immediately enforce Better Auth session checks on all routes. 
   * Add Role-Based Access Control (RBAC) so only vendors can access `/vendor` routes.
3. **Migrate Financials to Cents:** 
   * Convert all Prisma `Float` types for prices to `Int` (representing pesewas). E.g., GHS 10.50 is stored as `1050`. This prevents float rounding errors during commission calculation.

### Frontend Improvements
1. **Checkout Flow Redesign:** 
   * Change standard text-input addresses to dropdowns pre-populated with campus halls and hostels.
2. **Real-time Status Updates:** 
   * Implement WebSocket or polling for Order Statuses. Students expect instant updates when ordering food or last-minute items.
3. **Vendor Dashboard - Payouts:** 
   * Clearly separate "Pending Escrow" (funds tied to undelivered orders) and "Available for Withdrawal" balances.

---

## 5. Next Steps for the Development Team

1.  **Phase 1: Remediation (Immediate)**
    *   Execute Phase 1 of the `codebase_audit.md` (Auth guards, wire stub routes to Prisma, fix DB floats).
2.  **Phase 2: Escrow & Payment Logic**
    *   Update `payments.ts` and `orders.ts` to implement the Escrow holding pattern. Do NOT automatically credit vendor wallets upon Paystack webhooks.
3.  **Phase 3: UI Adaptation**
    *   Update the `CheckoutScreen.tsx` to include the new Campus/Hostel delivery dropdowns.
    *   Add "Make an Offer" button to `ProductDetailsScreen.tsx`.
4.  **Phase 4: Verification System**
    *   Update `RegisterScreen.tsx` to include an optional Student ID / University Email verification step.

---
*End of Audit*
