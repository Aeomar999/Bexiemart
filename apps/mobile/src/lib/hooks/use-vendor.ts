import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorApi } from "../api/vendor";

export const VENDOR_KEYS = {
  profile: ["vendor", "profile"] as const,
  stats: ["vendor", "stats"] as const,
  products: ["vendor", "products"] as const,
  orders: ["vendor", "orders"] as const,
  earnings: ["vendor", "earnings"] as const,
  transactions: ["vendor", "transactions"] as const,
  analytics: ["vendor", "analytics"] as const,
};

export function useVendorProfile() {
  return useQuery({
    queryKey: VENDOR_KEYS.profile,
    queryFn: () => vendorApi.getProfile().then((r) => r.data),
  });
}

export function useVendorStats() {
  return useQuery({
    queryKey: VENDOR_KEYS.stats,
    queryFn: () => vendorApi.getStats().then((r) => r.data),
  });
}

export function useVendorProducts() {
  return useQuery({
    queryKey: VENDOR_KEYS.products,
    queryFn: () => vendorApi.getProducts().then((r) => r.data?.data || r.data),
  });
}

import { PRODUCT_KEYS } from "./use-products";

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => vendorApi.createProduct(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: VENDOR_KEYS.products });
      qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => vendorApi.updateProduct(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: VENDOR_KEYS.products }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => vendorApi.deleteProduct(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: VENDOR_KEYS.products }),
  });
}

export function useVendorOrders(status?: string) {
  return useQuery({
    queryKey: [...VENDOR_KEYS.orders, status],
    queryFn: () => vendorApi.getOrders(status).then((r) => r.data?.data || r.data),
  });
}

export function useVendorOrder(id: string) {
  return useQuery({
    queryKey: [...VENDOR_KEYS.orders, id],
    queryFn: () => vendorApi.getOrder(id).then((r) => r.data),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      vendorApi.updateOrderStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: VENDOR_KEYS.orders }),
  });
}

export function useVendorEarnings() {
  return useQuery({
    queryKey: VENDOR_KEYS.earnings,
    queryFn: () => vendorApi.getEarnings().then((r) => r.data),
  });
}

export function useWithdrawEarnings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ amount, destination }: { amount: number; destination: string }) =>
      vendorApi.withdraw(amount, destination),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: VENDOR_KEYS.earnings });
      qc.invalidateQueries({ queryKey: VENDOR_KEYS.transactions });
    },
  });
}

export function useUpdateShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => vendorApi.updateShop(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: VENDOR_KEYS.stats });
      qc.invalidateQueries({ queryKey: VENDOR_KEYS.profile });
    },
  });
}
