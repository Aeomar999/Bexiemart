import type { User } from "@prisma/client";
import type { AuthenticatedRequest } from "./request.types";

/**
 * Creates a minimal mock of AuthenticatedRequest for unit tests.
 * Only carries the properties controllers actually access (req.user, req.correlationId).
 */
export function mockAuthRequest(
  overrides: Partial<Pick<AuthenticatedRequest, "user" | "correlationId">> = {}
): AuthenticatedRequest {
  return {
    user: { id: "test-user-id" } as User,
    correlationId: "test-correlation-id",
    ...overrides,
  } as AuthenticatedRequest;
}
