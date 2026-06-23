# PRD — Customer Service Support (Async-First Ticketing with Opportunistic Live Chat)

## 1. Document Header

| Field | Value |
|---|---|
| **Product / Feature** | Customer Service Support for BexieMart |
| **Author** | [Author Name] |
| **Date** | 2026-06-21 |
| **Version** | v1.2 |
| **Status** | Draft |
| **Stakeholders** | Product, Backend (NestJS), Mobile (Expo/React Native), Admin Web, Customer Support Ops, Compliance |
| **Changelog** | v1.2 — Resolved the three gating questions: **staffing = admins ad-hoc / no single owner** → SLA-breach alert + daily digest elevated to P0 (with no owner, they are the only anti-rot mechanism); **SLA window = validate-first** (route contact email to staff for ~2 weeks, publish ~2× measured); **push status = no push delivery exists today** → push requirement split into in-app delivery (near-free, reuses existing `Notification` store) and true Expo push (the longest pole). <br> v1.1 — Reframed from synchronous "live chat" to **async-first ticketing with opportunistic live chat**; push elevated to P0; agent refund quick-action deferred out of v1; queue sort changed to wait-time-primary; system-user seeding, reopen, media caps, KPI instrumentation added. (Following KILL CRITIC pre-mortem + REVIVAL ENGINE repair.) |

---

## 2. Executive Summary

BexieMart currently exposes a generic peer-to-peer chat (customer ↔ vendor) plus static FAQ/contact pages. The client wants to replace direct vendor chat with a structured **customer ↔ support agent** model. This feature layers a lightweight **SupportTicket** record on top of the existing real-time chat infrastructure so customers can raise categorized, order-linked support requests and receive help — while admins triage and resolve tickets from the existing web dashboard.

**v1 is deliberately async-first.** The product sets an honest response-time expectation ("we typically reply within [config] hours") and uses push notifications to close the loop. Live-chat affordances (typing indicators, "agent online") appear **only when an agent is genuinely present** in the conversation — they are an upside surprise, not a baseline promise. This reframe exists because support is staffed by admins as a part-time duty, not by a dedicated synchronous support team; promising live chat the org cannot staff would deliver a worse experience than the static FAQ it replaces. It reuses 100% of the existing WebSocket gateway, message persistence, presence, and typing systems rather than rebuilding them.

---

## 3. Problem Statement

- **Who:** Customers who hit problems (order, payment/refund, delivery, product, account) and the support staff (admins) who must resolve them.
- **Pain today:** Support is unstructured — static FAQ + `mailto:`/`tel:` links ([help.tsx](apps/mobile/app/(customer)/help.tsx), [contact.tsx](apps/mobile/app/(customer)/contact.tsx)). There is no queue, no ticket context, no SLA visibility, no audit trail, and no way to tie a complaint to a specific order. The generic vendor chat carries no metadata (category, status, priority) and no triage path.
- **Frequency / severity:** Every payment/refund/delivery dispute on a marketplace is high-severity and time-sensitive; mishandled disputes drive chargebacks, refunds-by-default, and churn.
- **Cost of inaction:** Support requests scatter across email/phone with no tracking; agents work blind (no order context); response times are unmeasurable; disputes escalate to payment-provider chargebacks. Trust — the core asset of an escrow marketplace — erodes.
- **Why async-first, not live chat:** The organization has no dedicated synchronous support staff. A live-chat UI sets a synchronous expectation the org cannot meet, producing broken-promise CSAT collapse. Async-first with honest SLAs + push converts a missed promise into a met expectation.
- **Jobs To Be Done:**
  - *When* I have a problem with an order, *I want to* reach support with my order context already attached and know when to expect a reply, *so that* I don't repeat myself and I'm not left guessing.
  - *When* I'm an agent, *I want to* see a prioritized queue with full order/customer context, *so that* I can resolve the highest-impact tickets first.

---

## 4. Goals & Success Metrics

**Primary goals (qualitative)**
1. Give customers a single, structured path to human support with an honest, met response-time expectation.
2. Give agents triage + context (queue, order link, history) to resolve efficiently.
3. Reuse existing chat infra — zero duplication of the real-time layer.
4. Establish a measurable, instrumented support funnel (created → first-response → resolved → rated).

**KPIs (quantitative)** — *targets to be baselined from the §13 pre-build validation; treat as `[ASSUMED]` until then.*
| Metric | Target |
|---|---|
| Median time-to-first-agent-response (within stated SLA window) | Meets stated window ≥ 90% of tickets [ASSUMED] |
| Ticket resolution rate (resolved / created) within 48h | ≥ 80% [ASSUMED] |
| Customer satisfaction (avg rating, 1–5) | ≥ 4.2 [ASSUMED] |
| % tickets created with a linked order (for order-related categories) | ≥ 70% [ASSUMED] |
| % support requests handled in-app vs. email/phone (deflection) | ≥ 60% within 90 days [ASSUMED] |
| % unclaimed tickets breaching SLA window | ≤ 10% [ASSUMED] |

**Anti-goals**
- Not building a full Zendesk/Intercom (no macros engine, no multi-channel email ingestion, no chatbot/AI deflection in v1).
- Not promising synchronous live chat the org cannot staff.
- Not optimizing for vendor↔customer chat (backend stays, hidden in UI).
- Not auto-assigning tickets in v1 (presence is not durable across instances — see §9).
- Not moving money from inside the chat in v1 (refund quick-action deferred — see §10).
- Not introducing a new platform-wide role in v1.

---

## 5. User Personas & Use Cases

**Persona A — Ama, the Customer (mobile)**
Context: Paid for an order via Paystack; delivery is late. Wants a refund or an update. Motivation: resolution + reassurance, and to know *when* she'll hear back.
- As a customer, I want to start a support request from the order I'm worried about, so support already knows which order I mean.
- As a customer, I want to pick a category and describe my issue once, so I'm routed correctly.
- As a customer, I want a clear "we'll reply within X hours" confirmation, so I'm not staring at an empty chat expecting an instant answer.
- As a customer, I want a push notification when support replies, so I don't have to keep the app open.
- As a customer, I want to rate the help I got, so good support is recognized.

**Persona B — Kwesi, the Support Agent (= Admin, web dashboard)**
Context: Logged into the admin web dashboard; checks the queue during business hours. Motivation: clear the queue, resolve high-impact disputes first.
- As an agent, I want a wait-time-sorted queue with category/order context, so I work the oldest/most urgent first.
- As an agent, I want to claim a ticket and see full order + customer + prior-ticket context, so I don't ask redundant questions.
- As an agent, I want to mark resolved (with notes) and optionally transfer to another agent.
- As an agent, I want to be alerted when a ticket has waited too long, so nothing rots in the queue.

**Persona C — Adwoa, the Support Lead / Admin**
Context: Oversees support quality. Motivation: SLA + CSAT visibility.
- As a lead, I want resolved-ticket history, ratings, and a daily open-ticket digest, so I can measure SLAs and catch backlog.

---

## 6. Functional Requirements

### 6.1 Ticket Creation (Customer · Mobile)
- **REQ-001 `[P0]`**: Customer can create a support ticket via `POST /support/tickets` with `category` (enum), `subject` (brief description), optional `orderId`, and optional first-message `content` + `mediaUrl`.
- **REQ-002 `[P0]`**: On creation, the system atomically (single transaction) creates (a) a `Conversation` of `type = SUPPORT` with the **customer as the sole participant**, and (b) the linked `SupportTicket`. Must NOT route through the peer-to-peer `createConversation` dedup path — uses a dedicated `createSupportConversation`.
- **REQ-003 `[P0]`**: On creation, the system seeds a persisted system message (sent by the seeded `SYSTEM` user — REQ-061) that **confirms receipt and states the SLA window**: e.g., *"Thanks — your request has been received. We typically reply within [config] hours."* This is expectation-setting, not a promise of immediacy.
- **REQ-004 `[P0]`**: `category` validated against `ORDER_ISSUE | PAYMENT_REFUND | DELIVERY | PRODUCT | ACCOUNT | OTHER`. `subject` length 3–200 chars.
- **REQ-005 `[P0]`**: If `orderId` is supplied, the system verifies the order belongs to the requesting customer (reject otherwise — prevents linking another user's order).
- **REQ-006 `[P1]`**: Priority is **derived server-side**, not asked. Reserve `URGENT` for a narrow, genuinely-rare trigger (e.g., payment failed AND order already marked delivered); default everything else to `NORMAL`. Do not auto-elevate whole categories to `HIGH` (avoids "everything is HIGH"). Threshold/rules configurable.
- **REQ-007 `[P2]`**: Entry points in mobile: "Chat with Support" on [help.tsx](apps/mobile/app/(customer)/help.tsx), "Live Chat" → relabeled **"Message Support"** card on [contact.tsx](apps/mobile/app/(customer)/contact.tsx), and "Report Issue" on order details (pre-fills `orderId` + category).

### 6.2 Customer Ticket Management (Mobile)
- **REQ-010 `[P0]`**: Customer can list their own tickets via `GET /support/tickets` with status badges (OPEN / ASSIGNED / IN_PROGRESS / RESOLVED / CLOSED).
- **REQ-011 `[P0]`**: Customer can open a ticket detail (`GET /support/tickets/:id`) showing a ticket metadata header + the embedded conversation (reuses existing chat UI).
- **REQ-012 `[P0]`**: Authorization — a customer may only read/list their own tickets and only access the conversation if they are a participant (existing participant ACL in `getConversation`).
- **REQ-013 `[P1]`**: Customer can rate a resolved ticket via `POST /support/tickets/:id/rate` (1–5 stars + optional comment); allowed only when `status ∈ {RESOLVED, CLOSED}`, only by the ticket owner; one rating per ticket (re-submission behavior — Q3).
- **REQ-014 `[P1]`**: Customer can **reopen** a RESOLVED/CLOSED ticket within N days (config) — a new customer message reopens it (status → IN_PROGRESS) and re-queues it, preserving full context instead of forcing a new ticket.

### 6.3 Async Expectation & Presence (Customer-facing)
- **REQ-015 `[P0]`**: The ticket UI displays the honest response-time expectation by default ("we typically reply within [config] hours"). It must NOT show "an agent will be with you shortly."
- **REQ-016 `[P0]`**: Live-chat affordances — typing indicator and an "agent online" badge — render **only** when an agent is an active participant AND has a live socket (gate on existing `isUserOnline()`, [chat.gateway.ts:121](apps/server/src/modules/chat/chat.gateway.ts#L121)). Absent that, the UI presents as async messaging.
- **REQ-017 `[P0]`**: Business-hours-aware notice driven by a **static business-hours config** (not live presence). In-hours: standard SLA copy. Out-of-hours: "We're offline — we'll reply by [next open time]."

### 6.4 Notifications (P0 — closes the async loop)
*Confirmed by audit: no Expo push delivery exists today. The in-app `Notification` store ([notifications.service.ts](apps/server/src/modules/notifications/notifications.service.ts)) exists and is reused; true push is net-new and is the longest pole.*
- **REQ-020a `[P0]` — In-app delivery (near-free):** When an agent or system posts a message to a ticket, write a `Notification` row for the customer (and surface the existing unread badge). This alone makes async support *functional* without any push infrastructure.
- **REQ-020b `[P0]` — True push (longest pole):** When an agent/system posts and the customer's socket is **not** connected, fire an Expo push notification deep-linking to `support/[id]`. Hooks into the existing non-sender participant computation ([chat.gateway.ts:204-214](apps/server/src/modules/chat/chat.gateway.ts#L204-L214)).
- **REQ-021 `[P0]` — Push token capture (gates REQ-020b):** Net-new work — mobile `expo-notifications` registration → `User.pushToken` field + migration → server `expo-server-sdk` send. Capture/store/refresh tokens. Est. ~2–3 days; this is the critical-path item for true push.
- **REQ-022 `[P0]`**: Fallback when push is unavailable/opted-out: unread badge on next app open (existing `unreadCount` + REQ-020a `Notification` rows). *Available regardless of push status.*
- **REQ-023 `[P1]`**: Agents receive notification (in-app/push/email) on new ticket assignment and on customer reply to a claimed ticket.

### 6.5 Agent Queue & Lifecycle (Admin · Web)
- **REQ-030 `[P0]`**: Agents (= ADMIN role) view the open ticket queue via `GET /support/tickets/queue`, **sorted by wait-time (oldest first), with priority as a minor tiebreaker only.** Returns **only `SupportTicket` metadata** (customer name, category, order #, subject, time-waiting) — never conversation message bodies (preserves participant-based message ACL).
- **REQ-031 `[P0]`**: Agent claims/assigns via `PATCH /support/tickets/:id/assign`. Claiming sets `agentId`, transitions `OPEN → ASSIGNED`, and **adds the agent as a participant** on the conversation (grants message read access).
- **REQ-032 `[P0]`**: Claim is **race-safe** — concurrent claims on the same OPEN ticket resolve to exactly one winner (conditional update on `agentId IS NULL` / status). Loser receives a clear "already claimed" response.
- **REQ-033 `[P0]`**: Once a participant, the agent exchanges messages over the **existing** WebSocket gateway (text + image, typing, read receipts) — no new real-time code.
- **REQ-034 `[P0]`**: Agent resolves via `PATCH /support/tickets/:id/resolve` with resolution notes; sets `resolvedAt`, `resolution`, status `RESOLVED`. Only the assigned agent or an admin may resolve.
- **REQ-035 `[P1]`**: Agent can transfer a ticket to another agent (swap the agent participant row; reassign `agentId`). Must not route through peer-to-peer dedup. Old agent optionally removed as participant.
- **REQ-036 `[P1]`**: First message from an assigned agent transitions `ASSIGNED → IN_PROGRESS`.
- **REQ-037 `[P1]`**: For refund-category tickets, the agent context panel shows a **deep-link to the order's refund action in the existing admin payment flow** (NOT an in-chat money mover — see §10). Agent resolves with a reference note.
- **REQ-038 `[P2]`**: Agent quick action — Escalate to admin (priority bump + flag).
- **REQ-039 `[P2]`**: Resolved-ticket history view with ratings + basic metrics (count, avg rating, median resolution time).

### 6.6 SLA Breach Handling (Anti-Rot) — P0 under ad-hoc staffing
*Staffing is "admins ad-hoc, no single owner" (Q8). With no owner, these alerts are the **only** mechanism preventing tickets from rotting unseen — hence P0, not P1.*
- **REQ-040 `[P0]`**: An **unclaimed-age alert** notifies all admins (in-app/push/email) when a ticket remains OPEN past a configurable threshold.
- **REQ-041 `[P0]`**: A scheduled **daily open-ticket digest** is sent to all admins summarizing OPEN/ASSIGNED tickets and their ages, so backlog is visible without a dedicated owner watching the queue.

### 6.7 Chat Infra Adaptation
- **REQ-050 `[P0]`**: Add `type` (`DIRECT | SUPPORT`) to `Conversation` so the customer chat list can filter support conversations out.
- **REQ-051 `[P0]`**: Mobile [chats/index.tsx](apps/mobile/app/(customer)/chats/index.tsx) excludes `SUPPORT` conversations from the general list (support lives in its own screens). Update empty-state copy.
- **REQ-052 `[P1]`**: Hide vendor↔customer direct-chat entry points in the customer UI behind an **explicit feature flag** (backend retained — see §10).

### 6.8 Abuse & Integrity Controls
- **REQ-060 `[P1]`**: Media uploads are capped per ticket and constrained by server-enforced max file size; reuse the existing 30/min message rate limit. Prevents storage abuse via support chat.
- **REQ-061 `[P0]`**: A single `SYSTEM` user row is seeded in the same migration that introduces `SupportTicket`, used as sender for system/seed messages. `Message.senderId` remains non-nullable.
- **REQ-062 `[P0]`**: Funnel events are instrumented and logged at the event level: `ticket_created`, `first_agent_response`, `ticket_resolved`, `ticket_rated`, `sla_breach` — so §4 KPIs are computable.

---

## 7. Non-Functional Requirements

- **Performance**: Ticket create round-trip < 500ms p95. Queue list < 800ms p95 at 1k open tickets. Real-time message delivery inherits existing gateway latency. Push delivery best-effort (Expo).
- **Security & Authorization** *(high priority — active `security/auth-guardrails` branch)*:
  - Customer endpoints owner-scoped; agent/admin endpoints role-guarded (ADMIN) via existing admin guard.
  - Message-body access remains strictly participant-gated via `getConversation` — the queue must never leak message content to non-participants.
  - `orderId` linkage validated against ownership (REQ-005).
  - **No money movement from inside chat in v1.** Refunds occur only through the existing hardened admin payment flow (REQ-037). The guarded in-chat refund action is deferred to its own future P1 feature with full controls (idempotency, amount ≤ order total, audit log) — out of scope here (§10).
- **Scalability**: In-memory presence/rate-limit Maps in `chat.gateway.ts` are per-instance — acceptable for single-instance v1. Multi-instance requires Redis-backed presence + rate limiting before horizontal scale (risk, not v1 scope).
- **Accessibility**: Mobile meets existing app a11y bar; admin queue WCAG 2.1 AA for status/priority badge contrast.
- **Platforms**: Mobile (Expo iOS/Android) for customer; admin web dashboard (existing) for agents.
- **Data retention**: Support tickets/transcripts retained for a **defined window (default 12 months post-close, pending compliance — Q5)** rather than indefinitely. PII-heavy content (addresses, payment complaints) treated accordingly.

---

## 8. User Experience & Design Direction

**Customer flow (mobile)**
1. Entry: Help Center "Chat with Support" / Order "Report Issue" / Contact "Message Support".
2. Select issue category (6 options).
3. (Conditional) For ORDER_ISSUE / DELIVERY / PAYMENT_REFUND — pick a recent order (or skip). "Other" skips the picker (Q6).
4. Describe issue (text + optional photo).
5. Submit → ticket created → conversation opens with the **receipt + SLA-window** system message.
6. Async messaging UI by default; live affordances (typing, "agent online") appear only when an agent is genuinely present. Push notification on agent reply.
7. On resolution → rate 1–5 + optional comment. Can reopen within N days.

**Agent flow (admin web)**
1. Open Support → Queue (wait-time-sorted; SLA-breach items flagged).
2. Inspect ticket card (customer, category, order #, wait-time, subject).
3. Claim → conversation opens with context panel (order details, customer history, prior tickets; refund deep-link for refund tickets).
4. Converse; use actions (resolve / escalate / transfer).
5. Resolve with notes → ticket leaves queue → customer notified (push).

**UX principles**
- Set honest expectations first; never imply instant response unless an agent is actually present.
- Ask once: never make the customer repeat order context the system already has.
- Don't make the customer self-triage urgency — derive priority server-side, sparingly.
- Reuse the familiar chat UI to minimize learning + build cost.

**Handoff notes**: New mobile screens under `apps/mobile/app/(customer)/support/` (`create-ticket.tsx`, `tickets.tsx`, `[id].tsx`). Admin: new Support section + ticket detail with context panel + refund deep-link. Badge color system needed (5 statuses + priority + SLA-breach flag). Default copy must reflect async framing.

---

## 9. Technical Considerations

**Reused infrastructure (verified in code):** `chat.gateway.ts` (better-auth session handshake, rooms, presence, typing, 30 msg/min rate limit, notifications), `chat.service.ts` (messages, read receipts, participant ACL), `Conversation`/`ConversationParticipant`/`Message` schema.

**Participant lifecycle (key constraint):** `createConversation` ([chat.service.ts:109-140](apps/server/src/modules/chat/chat.service.ts#L109-L140)) requires a `participantId`, sorts the pair, and dedupes on two users + `orderId`. Support conversations are born with **one** participant (the customer) and gain the agent **on claim**. → dedicated `createSupportConversation` path; transfer/assign are participant-row operations that bypass peer-to-peer dedup.

**Queue vs. ACL:** `getConversation` enforces participant-only message reads ([chat.service.ts:88](apps/server/src/modules/chat/chat.service.ts#L88)). The queue reads ticket metadata only; agents gain message access exactly when they become participants (on claim).

**System sender constraint:** `Message.senderId` is a required FK ([schema.prisma:502-503](apps/server/prisma/schema.prisma#L502-L503)). Seed a `SYSTEM` user in the migration (REQ-061); do not make `senderId` nullable.

**Push:** Confirm whether Expo push-token capture exists app-wide. If not, token capture/storage/refresh is in scope (REQ-021) and gates REQ-020.

**Schema changes (high-level):**
- New `SupportTicket` model: `userId`, `orderId?`, `conversationId @unique`, `category`, `subject`, `priority` (default NORMAL), `status` (default OPEN), `agentId?`, `resolvedAt?`, `resolution?`, `rating?`, `ratingComment?`, timestamps. Indexes on `status`, `agentId`, `userId`, `(status, createdAt)` for wait-time sort.
- `Conversation.type` enum (`DIRECT | SUPPORT`, default DIRECT) + relations from `User` (owner + assigned-agent) and `Order`.
- Seed `SYSTEM` user.
- **Migrations**: repo recently migrated to Prisma 7 and migrations were a noted gap — this feature ships with a proper migration (not `db push`), verified on staging.

**No new role:** Agents are ADMIN (confirmed). No `UserRole` enum change; reuse the existing admin guard.

**New module:** `apps/server/src/modules/support/` (`support.controller.ts`, `support.service.ts`, `support.module.ts`, `dto/`).

**Integrations:** Refunds reuse the existing hardened Paystack/payments admin flow via deep-link (REQ-037) — no new money-moving path in this module. Push via existing/added Expo push infra. Scheduled jobs (REQ-040/041) reuse existing cron/scheduling.

**Early investigation items:** transaction boundary for ticket+conversation+seed-message; race-safe claim (conditional update); Expo push-token status.

---

## 10. Out of Scope (v1)

- **In-chat agent refund/money-movement action** — deferred to a future, fully-guarded P1 feature (idempotency, amount validation, audit log). v1 agents use the existing admin payment flow via deep-link.
- New `AGENT` platform role and dedicated agent mobile app (phase 2).
- Auto-assignment / round-robin routing.
- Redis-backed durable presence & rate limiting (required before multi-instance; not this release).
- AI/chatbot deflection, canned-response macros, multi-channel (email/SMS) ingestion.
- Full SLA engine / advanced analytics dashboards (basic metrics + breach alerts only).
- Removing the vendor↔customer chat backend (only hidden in UI, behind a flag).
- Live agent-online presence as a routing or availability signal (used only as an opportunistic UI affordance).

---

## 11. Open Questions

**✅ Resolved (the three gating questions)**
- **~~Q8 — Staffing model:~~ RESOLVED → admins ad-hoc, no single owner.** v1 ships as async chat (not the contact-form fallback). Consequence: SLA-breach alert + daily digest are P0 (§6.6); published SLA window must be conservative.
- **~~Q2 — SLA window:~~ RESOLVED → validate-first.** Route existing contact email to staff for ~2 weeks (§13), measure real response time, publish ~2× the measured median. No published number is committed until validation completes; copy uses a config placeholder until then.
- **~~Push-token status:~~ RESOLVED by audit → no Expo push delivery exists.** Split into in-app delivery (REQ-020a, near-free) and true push (REQ-020b/021, ~2–3 days, critical path).

**Still open**
1. **Refund workflow detail (Q1):** confirm the deep-link target + whether partial refunds are supported in the existing admin flow. [Owner: Payments/Product] [Due: before REQ-037]
2. **Rating re-submission (Q3):** allow overwrite or one-shot? [Owner: Product]
3. **Business-hours config (Q4):** exact hours/timezone and out-of-hours copy. [Owner: Support Ops]
4. **Data retention / PII policy (Q5):** confirm the 12-month-post-close default. [Owner: Compliance]
5. **"Other" category (Q6):** skip the order-picker entirely? [Owner: Product]
6. **Reopen window N (Q7):** how many days can a CLOSED ticket be reopened? [Owner: Product]
7. **Unclaimed-age + digest thresholds (new):** at what age does REQ-040 fire, and what time does the REQ-041 digest send? [Owner: Support Ops]

---

## 12. Dependencies & Risks

| Dependency / Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| No one staffs the queue → empty-chair failure | Med | High | Q8 decision before build; honest async SLA copy; unclaimed-age alert + daily digest (REQ-040/041). If unstaffable → contact-form fallback (§13 pivot) |
| Push infra/token capture not in place | Med | High | Confirm early (REQ-021); scope token work into v1; unread-badge fallback (REQ-022) |
| In-memory presence/rate-limit breaks at multi-instance | High (if scaled) | Med | Single-instance v1; track Redis migration before scale-out |
| Reusing `createConversation` by mistake (dedup corrupts support flow) | Med | High | Dedicated `createSupportConversation`; code review + test |
| Queue leaking message bodies to non-participants | Low | High | Queue returns metadata only; explicit test asserts no message content |
| Claim race conditions (double-assign) | Med | Med | Conditional/atomic update; loser gets "already claimed" |
| Missing migration (repo had no-migrations gap) | Med | High | Ship Prisma migration; verify on staging |
| Order ownership not validated on link | Med | High | REQ-005 server-side ownership check |
| Seed system message blocked by required `senderId` | Low | Med | Seed `SYSTEM` user in migration (REQ-061) |
| Priority collapses to "everything HIGH" | (avoided) | — | Wait-time-primary sort (REQ-030); narrow URGENT trigger (REQ-006) |

---

## 13. Timeline & Milestones

| Phase | Status / Notes |
|---|---|
| Discovery | Complete (design doc + code-grounded brainstorm + KILL CRITIC + REVIVAL ENGINE) |
| **Pre-build validation** | **Q8 + push-token status resolved.** Remaining: route existing contact email to the ad-hoc admin pool for ~2 weeks; measure real median response time + volume; publish the SLA window at ~2× the median. Build can start in parallel (copy uses a config placeholder); only the *published number* waits on this. |
| Design (mobile async screens + admin Support section) | [TBD] |
| Engineering (schema + migration + SYSTEM user; support module; mobile screens; admin UI; push hook; SLA alerts; instrumentation) | [TBD] |
| QA (unit: lifecycle; integration: ticket+conversation atomicity, claim race, ACL, push-on-offline, SLA alert) | [TBD] |
| Launch | [TBD] |

**Pivot trigger:** If Q8 resolves to "no one will staff a queue," drop the conversation layer for v1 and ship **structured contact form → email** (keep `SupportTicket`, categories, order-linking, photo; defer chat). All such work is forward-compatible with re-adding chat later.

---

## 14. Appendix

- Source design doc: `customer_service.md`
- Process trail: PRISM PRD v1.0 → KILL CRITIC pre-mortem (Kill Score 5/10) → REVIVAL ENGINE repair (Revival Score 8/10) → this v1.1.
- Code references: [chat.service.ts](apps/server/src/modules/chat/chat.service.ts), [chat.gateway.ts](apps/server/src/modules/chat/chat.gateway.ts), [schema.prisma](apps/server/prisma/schema.prisma) (`Conversation` L472, `Message` L498, `UserRole` L544), [help.tsx](apps/mobile/app/(customer)/help.tsx), [contact.tsx](apps/mobile/app/(customer)/contact.tsx), [chats/index.tsx](apps/mobile/app/(customer)/chats/index.tsx)
- Recommended approach: Option A (Ticket-Wrapped Chat), async-first framing.

---
## PRISM's Notes

**Assumptions made:**
- KPI targets remain placeholders pending the §13 pre-build validation (especially the published SLA window).
- Default retention 12 months post-close, pending compliance.
- Narrow `URGENT` trigger and minimal priority derivation.
- "Other" skips order picker; reopen window N configurable.

**Gaps filled (v1.1):**
- Reframed synchronous live chat → async-first ticketing with opportunistic live affordances gated on real agent presence.
- Elevated push notifications to P0 as the mechanism that closes the async loop; scoped token capture as a dependency.
- Deferred in-chat refund money-movement out of v1; replaced with a deep-link to the hardened admin payment flow.
- Changed queue sort to wait-time-primary; narrowed priority to avoid "everything HIGH."
- Added explicit staffing-model gate (Q8), SLA-breach alert + daily digest, ticket reopen, media abuse caps, SYSTEM-user seeding, and KPI event instrumentation.

**Top 3 open questions to resolve first:**
1. **Staffing model (Q8)** — gates everything; determines the SLA window and whether v1 ships as chat or contact-form fallback.
2. **Push-token capture status (REQ-021)** — without push, async support doesn't function; confirm before committing the build estimate.
3. **Published SLA window (Q2)** — set it from the §13 validation, not a guess; it's the promise the whole async reframe depends on meeting.
