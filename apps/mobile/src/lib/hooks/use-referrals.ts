import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { referralsApi } from "../api/referrals";

export function useReferralProfile() {
  return useQuery({
    queryKey: ["referrals", "profile"],
    queryFn: () => referralsApi.getProfile().then((r) => r.data),
  });
}

export function useReferralStats() {
  return useQuery({
    queryKey: ["referrals", "stats"],
    queryFn: () => referralsApi.getStats().then((r) => r.data),
  });
}

export function useGenerateReferralCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => referralsApi.generate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["referrals", "profile"] });
    },
  });
}

export function useApplyReferralCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => referralsApi.apply(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["referrals", "profile"] });
      qc.invalidateQueries({ queryKey: ["referrals", "stats"] });
    },
  });
}
