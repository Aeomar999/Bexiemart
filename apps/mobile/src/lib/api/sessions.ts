import { apiClient } from "./client";

export interface SessionItem {
  id: string;
  token: string;
  userId: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  expiresAt: string;
}

export const sessionsApi = {
  list: () => apiClient.get<SessionItem[]>("/auth/list-sessions"),
  revoke: (token: string) => apiClient.post("/auth/revoke-session", { token }),
  revokeOthers: () => apiClient.post("/auth/revoke-other-sessions", {}),
};
