import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "../api/orders";

export const ORDER_KEYS = {
  all: ["orders"] as const,
  detail: (id: string) => ["orders", id] as const,
};

export function useOrders() {
  return useQuery({
    queryKey: ORDER_KEYS.all,
    queryFn: () => ordersApi.getAll().then((r) => r.data),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ORDER_KEYS.detail(id),
    queryFn: () => ordersApi.getOne(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof ordersApi.create>[0]) =>
      ordersApi.create(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      ordersApi.cancel(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
    },
  });
}
