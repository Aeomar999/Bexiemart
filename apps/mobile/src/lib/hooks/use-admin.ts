import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api/admin";

export const ADMIN_KEYS = {
  users: (page?: number) => ["admin", "users", page] as const,
  user: (id: string) => ["admin", "users", id] as const,
  vendors: ["admin", "vendors"] as const,
  config: ["admin", "config"] as const,
  orders: (status?: string, page?: number) =>
    ["admin", "orders", status, page] as const,
  order: (id: string) => ["admin", "orders", id] as const,
};

export function useAdminUsers(page = 1) {
  return useQuery({
    queryKey: ADMIN_KEYS.users(page),
    queryFn: () => adminApi.getUsers(page).then((r) => r.data.data ?? r.data),
  });
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: ADMIN_KEYS.user(id),
    queryFn: () => adminApi.getUser(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      adminApi.updateUserRole(id, role).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useAdminVendors() {
  return useQuery({
    queryKey: ADMIN_KEYS.vendors,
    queryFn: () => adminApi.getVendors().then((r) => r.data),
  });
}

export function useApproveVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.approveVendor(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_KEYS.vendors }),
  });
}

export function useSuspendVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.suspendVendor(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_KEYS.vendors }),
  });
}

export function useAdminConfig() {
  return useQuery({
    queryKey: ADMIN_KEYS.config,
    queryFn: () => adminApi.getConfig().then((r) => r.data),
  });
}

export function useUpdateAdminConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, any>) =>
      adminApi.updateConfig(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_KEYS.config }),
  });
}

export function useAdminOrders(status?: string, page = 1) {
  return useQuery({
    queryKey: ADMIN_KEYS.orders(status, page),
    queryFn: () => adminApi.getOrders(status, page).then((r) => r.data.data ?? r.data),
  });
}

export function useAdminOrder(id: string) {
  return useQuery({
    queryKey: ADMIN_KEYS.order(id),
    queryFn: () => adminApi.getOrder(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateOrderStatus(id, status).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "orders"] }),
  });
}
