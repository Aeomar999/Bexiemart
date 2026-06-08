import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorPaymentMethodsApi } from "../api/vendor-payment-methods";

export const KEYS = { all: ["vendor-payment-methods"] as const };

export function useVendorPaymentMethods() {
  return useQuery({ queryKey: KEYS.all, queryFn: () => vendorPaymentMethodsApi.getAll().then((r) => r.data) });
}

export function useAddBankAccount() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data) => vendorPaymentMethodsApi.addBank(data), onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }) });
}

export function useAddMomoAccount() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data) => vendorPaymentMethodsApi.addMomo(data), onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }) });
}

export function useRemovePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ type, id }: { type: string; id: string }) => vendorPaymentMethodsApi.remove(type, id), onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }) });
}

export function useSetDefaultPaymentMethod() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ type, id }: { type: string; id: string }) => vendorPaymentMethodsApi.setDefault(type, id), onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }) });
}
