# Support Chat — Implementation Sequence (P0 Build)

Companion to [support-chat-prd.md](support-chat-prd.md) v1.2. Dependency-ordered. Each phase ends in a committable, testable state. Phases 1–6 are the P0 path; P1/P2 follow.

**Grounding facts (verified in code):**
- Chat infra reused as-is: [chat.gateway.ts](apps/server/src/modules/chat/chat.gateway.ts), [chat.service.ts](apps/server/src/modules/chat/chat.service.ts).
- Agents = ADMIN via existing `AdminGuard = createRoleGuard(UserRole.ADMIN)` ([admin.guard.ts](apps/server/src/guards/admin.guard.ts)).
- In-app notifications exist ([notifications.service.ts](apps/server/src/modules/notifications/notifications.service.ts)); `Notification` model has `title/message/type/data`; `NotificationType` enum needs a `support` value.
- `Message.senderId` is a required FK → must seed a `SYSTEM` user.
- `createConversation` ([chat.service.ts:109](apps/server/src/modules/chat/chat.service.ts#L109)) is peer-to-peer/2-participant — must NOT be reused; add `createSupportConversation`.
- No Expo push today → Phase 5 is net-new and the longest pole.

---

## Phase 0 — Schema & Migration *(foundation; everything depends on it)*

**Goal:** one Prisma migration that introduces all new structures + the SYSTEM user.

1. `schema.prisma`:
   - Add `enum ConversationType { DIRECT SUPPORT }`; add `type ConversationType @default(DIRECT)` to `Conversation` (+ index).
   - Add `SupportTicket` model: `userId`, `orderId?`, `conversationId @unique`, `category`, `subject`, `priority @default("NORMAL")`, `status @default("OPEN")`, `agentId?`, `resolvedAt?`, `resolution?`, `rating?`, `ratingComment?`, timestamps. Indexes: `status`, `agentId`, `userId`, `@@index([status, createdAt])` (wait-time sort).
   - Relations on `User`: tickets (owner) + assignedTickets (`"AssignedAgent"`); on `Order`: optional tickets.
   - Add `pushToken String?` + `pushTokenUpdatedAt DateTime?` to `User` (Phase 5 needs it; include now to avoid a second migration).
   - Add `support` to `NotificationType` enum.
2. `prisma migrate dev --name support_tickets` (proper migration, **not** `db push` — repo had a no-migrations gap).
3. Seed `SYSTEM` user: extend [seed-admin.ts](apps/server/src/scripts/seed-admin.ts) (or a dedicated seed) to upsert a deterministic `SYSTEM` user (fixed id/email, role e.g. ADMIN or a sentinel) idempotently. Export its id via config/constant for Phase 2.

**Done when:** migration applies clean on a fresh DB + staging; `SYSTEM` user exists; `npx prisma generate` types available.
**Tests:** migration runs in CI; seed is idempotent (run twice, one row).

---

## Phase 1 — Support Module Skeleton + Ticket Creation *(REQ-001..005, 050)*

**Goal:** customer can create a ticket; conversation is born with one participant + seeded system message, atomically.

1. New `apps/server/src/modules/support/` — `support.module.ts` (imports `AuthModule`, `PrismaModule`; provides `SupportService`; controller), mirroring [chat.module.ts](apps/server/src/modules/chat/chat.module.ts). Register in `app.module.ts`.
2. `ChatService.createSupportConversation(userId)` — creates a `Conversation { type: SUPPORT }` with **one** participant (the customer). Does NOT touch the peer-to-peer dedup path.
3. `SupportService.createTicket(userId, dto)` in a **single Prisma transaction**:
   - validate `orderId` ownership if present (REQ-005);
   - derive priority server-side (REQ-006 — narrow URGENT, else NORMAL);
   - create support conversation;
   - create `SupportTicket`;
   - seed system message via `ChatService.createMessage(convId, SYSTEM_USER_ID, receiptCopy)` (REQ-003).
4. DTOs: `CreateTicketDto` (category enum, subject 3–200, optional orderId/content/mediaUrl) with class-validator.
5. `POST /support/tickets` (auth-guarded, owner = session user).

**Done when:** creating a ticket yields ticket + SUPPORT conversation + 1 participant + 1 system message, all-or-nothing.
**Tests (unit + integration):** atomicity (force failure → nothing persisted); order-ownership rejection; priority derivation; system message authored by SYSTEM user.

---

## Phase 2 — Customer Ticket APIs *(REQ-010..012, 051)*

**Goal:** customer can list/read their tickets; support convos hidden from general chat.

1. `GET /support/tickets` (owner-scoped list with status), `GET /support/tickets/:id` (owner-scoped; conversation access still via existing participant ACL in `getConversation`).
2. Filter `type = SUPPORT` out of `ChatService.getConversations` (REQ-051) so support doesn't leak into the customer chat list. Update empty-state copy on [chats/index.tsx](apps/mobile/app/(customer)/chats/index.tsx).

**Done when:** customer sees only their tickets; support convos absent from the general chat list.
**Tests:** cross-user read returns 403/404; support conversation excluded from `getConversations`.

---

## Phase 3 — Agent Queue & Lifecycle *(REQ-030..034, 036)*

**Goal:** admin sees a wait-time queue, claims race-safely, converses, resolves.

1. `GET /support/tickets/queue` (`AdminGuard`) — returns **ticket metadata only** (no message bodies), `ORDER BY createdAt ASC` with priority as minor tiebreaker (REQ-030).
2. `PATCH /support/tickets/:id/assign` (`AdminGuard`) — **race-safe** conditional update (`updateMany where agentId = null AND status = OPEN`); if count 0 → "already claimed". On win: set `agentId`, status `ASSIGNED`, **add agent as conversation participant** (this is what grants message read access).
3. `PATCH /support/tickets/:id/resolve` (`AdminGuard`) — assigned-agent-or-admin only; set `resolvedAt/resolution/status=RESOLVED`.
4. First agent message flips `ASSIGNED → IN_PROGRESS` (REQ-036) — hook in service or on send.
5. Messaging itself = existing gateway, no new real-time code.

**Done when:** two concurrent claims → exactly one winner; claimed agent can read/send; resolve transitions correctly.
**Tests:** concurrent-claim race (one winner, loser gets clear error); non-participant admin cannot read messages until claim; resolve authz.

---

## Phase 4 — In-App Notifications *(REQ-020a, 022)*  ← makes async **functional** without push

**Goal:** customer gets an in-app notification + unread badge on agent reply, even offline. No push infra needed.

1. On agent/system message to a support ticket, write a `Notification` row (`type: support`, deep-link payload in `data`) for the customer. Hook at the non-sender participant computation in [chat.gateway.ts:204-214](apps/server/src/modules/chat/chat.gateway.ts#L204-L214), or in `SupportService`.
2. Reuse existing `getUnreadCount`/list endpoints for the badge.

**Done when:** offline customer, on next app open, sees an unread support notification linking to the ticket.
**Tests:** notification row created on agent reply; not created for the sender; correct deep-link payload.

> **Milestone — Async MVP shippable here** (with Phase 6 mobile screens). Everything past this is enhancement.

---

## Phase 5 — True Expo Push *(REQ-020b, 021)*  ← longest pole, net-new

**Goal:** wake a closed app when an agent replies and the customer socket is disconnected.

1. **Mobile:** `expo install expo-notifications expo-device`; registration helper (permissions → `getExpoPushTokenAsync`) → `POST /users/push-token`. Handler in `_layout.tsx` for taps → deep-link to `support/[id]`.
2. **Server:** `POST /users/push-token` persists `User.pushToken` (field added in Phase 0). Add `expo-server-sdk`; a `PushService.send(userId, payload)`.
3. **Wire:** in the same offline-customer branch as Phase 4, if `!isUserOnline(customerId)` and a `pushToken` exists → send push (Phase 4 in-app row still written as fallback).

**Done when:** physical-device test — app closed, agent replies, push arrives and deep-links correctly.
**Tests:** push fires only when socket disconnected + token present; in-app fallback always written; token capture/refresh persists.

---

## Phase 6 — Mobile Support Screens *(REQ-007, 011, 015, 016, 017)*

**Goal:** the async-first customer UI.

1. `apps/mobile/app/(customer)/support/` — `create-ticket.tsx` (category → conditional order picker → description + photo → submit), `tickets.tsx` (list + status badges), `[id].tsx` (ticket header + **reused chat UI**).
2. **Async framing (critical):** default copy = "we typically reply within [config] hours"; **no** "agent will be with you shortly". Typing indicator + "agent online" badge render **only** when an agent participant has a live socket (gate on presence). Business-hours notice (REQ-017).
3. Entry points: "Chat with Support" ([help.tsx](apps/mobile/app/(customer)/help.tsx)), relabel "Live Chat"→"Message Support" ([contact.tsx](apps/mobile/app/(customer)/contact.tsx)), "Report Issue" on order detail (pre-fills orderId+category).

**Done when:** end-to-end from mobile — create ticket → message → see agent reply (in-app + push) → resolution; async copy never over-promises.

---

## Phase 7 — Anti-Rot (P0 under ad-hoc staffing) *(REQ-040, 041)*

**Goal:** with no queue owner, nothing rots unseen.

1. Scheduled job (reuse existing cron/scheduler): **unclaimed-age alert** to all admins (in-app + push/email) when a ticket is OPEN past threshold (REQ-040).
2. **Daily open-ticket digest** to all admins (REQ-041). Thresholds/time are config (open question — §11 Q7-new).

**Done when:** an OPEN ticket past threshold reliably alerts admins; daily digest sends.
**Tests:** alert fires once past threshold (no duplicate spam); digest content correct.

---

## Phase 8 — Enhancements (P1/P2, post-MVP)

- **REQ-013/014** rating + reopen-within-N-days.
- **REQ-035** transfer (swap agent participant; bypass dedup).
- **REQ-037** refund **deep-link** to existing admin payment flow (NO in-chat money movement — deferred per §10).
- **REQ-023** agent-side notifications; **REQ-038** escalate; **REQ-039** resolved history + metrics.
- **REQ-052** feature-flag the hidden vendor chat.
- **REQ-060** media abuse caps; **REQ-062** finalize KPI event instrumentation.

---

## Critical Path & Parallelization

```
Phase 0 (schema+SYSTEM+pushToken field)
   ├─► Phase 1 ─► Phase 2 ─► Phase 3 ─► Phase 4 ──┐
   │                                              ├─► Phase 6 (mobile) ─► Async MVP
   └─► Phase 5 (push: mobile+server, parallel) ───┘
                                   Phase 7 (anti-rot) parallel after Phase 3
```

- **Longest pole:** Phase 5 (Expo push) — start its mobile/server scaffolding in parallel right after Phase 0, since it only needs the `pushToken` field, not the ticket lifecycle.
- **Earliest shippable:** after Phases 1–4 + 6 (async MVP via in-app notifications). Push (5) and anti-rot (7) can land shortly after without blocking launch — though Phase 7 should land before real volume given ad-hoc staffing.
- **Runs in parallel with build:** the 2-week SLA email-routing validation (§13) — only the *published SLA number* depends on it, not the code.

## Cross-Cutting

- **Migrations:** every schema change is a committed Prisma migration verified on staging.
  - **Neon runbook (learned in Phase 0):** `DATABASE_URL` in `.env` is the **pooled** endpoint (`-pooler` + `pgbouncer=true`). `prisma migrate dev` **hangs** through the pooler (tries to create a shadow DB it can't). Run migrations against the **direct** endpoint (same host minus `-pooler`, drop `pgbouncer=true`). For Neon (no shadow-DB permission) the reliable flow is: `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script` → hand-place the SQL in a `prisma/migrations/<ts>_<name>/migration.sql` folder → `prisma migrate deploy` (with the direct URL exported). `prisma.config.ts` reads `process.env.DATABASE_URL`; `dotenv/config` does not override an already-exported var, so `export DATABASE_URL=<direct>` wins for the command.
  - **Pre-existing drift:** the live DB is still at `0_init`; the delivery/dispatcher refactor (DeliveryJob, pricing config, `DROP TABLE RideRequest`, `DROP COLUMN Order.dispatcherId`) is in `schema.prisma` but **not yet migrated**. The Phase 0 `support_tickets` migration was deliberately authored as a **support-only subset** to avoid bundling that unrelated/destructive DDL. Until the delivery work ships its own migration, `migrate diff`/`migrate dev` will keep reporting that drift — expected, not an error.
- **Authz invariant:** queue endpoints expose ticket metadata only; message bodies stay participant-gated. Add an explicit test asserting the queue returns no message content.
- **Security branch:** no new money-moving surface (refund stays a deep-link). Keep changes consistent with `security/auth-guardrails` work.
