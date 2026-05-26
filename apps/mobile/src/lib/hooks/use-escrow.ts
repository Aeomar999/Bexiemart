import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { escrowApi } from "../api/escrow";

export const ESCROW_KEYS = {
  all: ["escrow"] as const,
  detail: (id: string) => ["escrow", id] as const,
};

export function useEscrows() {
  return useQuery({
    queryKey: ESCROW_KEYS.all,
    queryFn: () => escrowApi.list().then((r) => r.data),
  });
}

export function useEscrow(id: string) {
  return useQuery({
    queryKey: ESCROW_KEYS.detail(id),
    queryFn: () => escrowApi.get(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useReleaseEscrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => escrowApi.release(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ESCROW_KEYS.all }),
  });
}

export function useRefundEscrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => escrowApi.refund(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ESCROW_KEYS.all }),
  });
}

export function useDisputeEscrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      escrowApi.dispute(id, reason).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ESCROW_KEYS.all }),
  });
}
