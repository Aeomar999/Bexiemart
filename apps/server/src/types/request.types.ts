import { Request } from "express";
import type { User } from "@prisma/client";

/**
 * Extended Express Request with authenticated user and correlation ID.
 * Set by AuthGuard/OptionalAuthGuard after validating the session token.
 */
export interface AuthenticatedRequest extends Request {
  user: User;
  correlationId?: string;
  /** Set by NestFactory when `rawBody: true` (used for Paystack webhook verification) */
  rawBody?: Buffer;
}

/**
 * Minimal mock shape for use in unit tests.
 * Only carries the properties controllers actually access.
 * Usage: `{ user: { id: "..." } } as MockRequest`
 */
export type MockRequest = Pick<AuthenticatedRequest, "user" | "correlationId">;
