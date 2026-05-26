import { apiClient } from "./client";

export const adminApi = {
  getUsers: (page = 1, limit = 20) => apiClient.get(`/admin/users?page=${page}&limit=${limit}`),
  getUser: (id: string) => apiClient.get(`/admin/users/${id}`),
  updateUserRole: (id: string, role: string) => apiClient.patch(`/admin/users/${id}/role`, { role }),
  getVendors: () => apiClient.get("/admin/vendors"),
  approveVendor: (id: string) => apiClient.patch(`/admin/vendors/${id}/approve`),
  suspendVendor: (id: string) => apiClient.patch(`/admin/vendors/${id}/suspend`),
  getConfig: () => apiClient.get("/admin/config"),
  updateConfig: (data: Record<string, any>) => apiClient.put("/admin/config", data),
  getOrders: (status?: string, page = 1, limit = 20) =>
    apiClient.get(`/admin/orders?page=${page}&limit=${limit}${status ? `&status=${status}` : ""}`),
  getOrder: (id: string) => apiClient.get(`/admin/orders/${id}`),
  updateOrderStatus: (id: string, status: string) =>
    apiClient.patch(`/admin/orders/${id}/status`, { status }),
};
