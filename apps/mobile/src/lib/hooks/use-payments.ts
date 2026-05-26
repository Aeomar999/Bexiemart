import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentsApi } from "../api/payments";
import { customerPaymentMethodsApi } from "../api/customer-payment-methods";

export const PAYMENT_KEYS = {
  all: ["customer-payment-methods"] as const,
};

export function useInitializePayment() {
  return useMutation({
    mutationFn: (data: { orderId: string; callbackUrl?: string }) =>
      paymentsApi.initialize(data).then((r) => r.data),
  });
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: PAYMENT_KEYS.all,
    queryFn: () => customerPaymentMethodsApi.getAll().then((r) => r.data),
  });
}

export function useAddPaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      type: "card" | "momo";
      provider: string;
      details: string;
      holderName: string;
      expiry?: string;
      isDefault?: boolean;
    }) => {
      if (data.type === "card") {
        return customerPaymentMethodsApi
          .addCard({
            provider: data.provider,
            details: data.details,
            holderName: data.holderName,
            expiry: data.expiry!,
            isDefault: data.isDefault,
          })
          .then((r) => r.data);
      }
      return customerPaymentMethodsApi
        .addMomo({
          provider: data.provider,
          details: data.details,
          holderName: data.holderName,
          isDefault: data.isDefault,
        })
        .then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PAYMENT_KEYS.all }),
  });
}

export function useRemovePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      customerPaymentMethodsApi.remove(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PAYMENT_KEYS.all }),
  });
}

export function useSetDefaultPaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      customerPaymentMethodsApi.setDefault(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PAYMENT_KEYS.all }),
  });
}
