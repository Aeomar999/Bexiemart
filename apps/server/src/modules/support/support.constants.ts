/**
 * Deterministic id of the SYSTEM user that authors automated support messages
 * (e.g. the "request received" receipt seeded on ticket creation — REQ-003).
 *
 * `Message.senderId` is a required FK, so seeded/system messages need a real
 * User row to point at. This user is non-login (no Account/Session) and is
 * created idempotently by `src/scripts/seed-system-user.ts`.
 */
export const SYSTEM_USER_ID = "system";

export const SYSTEM_USER_EMAIL = "system@bexiemart.internal";

export const SYSTEM_USER_NAME = "BexieMart Support";

/** Support ticket categories (REQ-004). */
export const SUPPORT_CATEGORIES = [
  "ORDER_ISSUE",
  "PAYMENT_REFUND",
  "DELIVERY",
  "PRODUCT",
  "ACCOUNT",
  "OTHER",
] as const;
export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

/** Ticket lifecycle states. */
export const TICKET_STATUS = {
  OPEN: "OPEN",
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
} as const;

/** Ticket priorities (derived server-side — REQ-006). */
export const TICKET_PRIORITY = {
  LOW: "LOW",
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

/**
 * Receipt seeded as the first message on every new ticket (REQ-003). Async-first
 * framing: confirms receipt and sets expectations without promising immediacy.
 */
export const TICKET_RECEIPT_MESSAGE =
  "Thanks — your request has been received. Our support team will reply as soon as an agent is available. You'll get a notification when they respond.";
