import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { twoFactorApi, type TwoFactorEnableResponse } from "../api/two-factor";

export const TWO_FACTOR_KEY = ["auth", "2fa"] as const;

export function useTwoFactorStatus() {
  return useQuery({
    queryKey: TWO_FACTOR_KEY,
    queryFn: () => twoFactorApi.getStatus(),
  });
}

export function useEnableTwoFactor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (password: string) => twoFactorApi.enable(password).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TWO_FACTOR_KEY });
      qc.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}

export function useVerifyTotp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => twoFactorApi.verifyTotp(code).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TWO_FACTOR_KEY });
      qc.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}

export function useDisableTwoFactor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (password: string) => twoFactorApi.disable(password).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TWO_FACTOR_KEY });
      qc.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}

export function useGenerateBackupCodes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (password: string) =>
      twoFactorApi.generateBackupCodes(password).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TWO_FACTOR_KEY });
    },
  });
}
