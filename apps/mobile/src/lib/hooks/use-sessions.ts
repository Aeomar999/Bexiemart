import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sessionsApi, type SessionItem } from "../api/sessions";

export const SESSIONS_KEY = ["auth", "sessions"] as const;

export function useSessions() {
  return useQuery<SessionItem[]>({
    queryKey: SESSIONS_KEY,
    queryFn: () => sessionsApi.list().then((r) => r.data),
  });
}

export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => sessionsApi.revoke(token).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: SESSIONS_KEY }),
  });
}

export function useRevokeOtherSessions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => sessionsApi.revokeOthers().then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: SESSIONS_KEY }),
  });
}

export function parseDeviceLabel(userAgent?: string | null): string {
  if (!userAgent) return "Unknown Device";
  const ua = userAgent.toLowerCase();
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) return "iOS Device";
  if (ua.includes("android")) return "Android Device";
  if (ua.includes("macintosh") || ua.includes("mac os")) return "MacBook / Mac";
  if (ua.includes("windows")) return "Windows PC";
  if (ua.includes("linux")) return "Linux PC";
  return "Mobile / Web Device";
}
