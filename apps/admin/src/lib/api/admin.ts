import { apiClient } from "./client";

export const getDashboardStats = async () => {
  const { data } = await apiClient.get("/admin/dashboard");
  return data;
};

// Users
export const listCoupons = async (params?: Record<string, any>) => {
  const { data } = await apiClient.get("/admin/coupons", { params });
  return data;
};

export const createCoupon = async (payload: any) => {
  const { data } = await apiClient.post("/admin/coupons", payload);
  return data;
};

export const getAdminUsers = async (params?: Record<string, any>) => {
  const { data } = await apiClient.get("/admin/users", { params });
  return data;
};

export const getAdminUser = async (id: string) => {
  const { data } = await apiClient.get(`/admin/users/${id}`);
  return data;
};

export const updateUserRole = async (id: string, role: string) => {
  const { data } = await apiClient.patch(`/admin/users/${id}/role`, { role });
  return data;
};

// Admin Team (super-admin only)
export const getAdmins = async () => {
  const { data } = await apiClient.get("/admin/admins");
  return data;
};

export const createAdmin = async (payload: { email: string; name: string; password: string }) => {
  const { data } = await apiClient.post("/admin/admins", payload);
  return data;
};

// Vendors
export const getAdminVendors = async (params?: Record<string, any>) => {
  const { data } = await apiClient.get("/admin/vendors", { params });
  return data;
};

export const getAdminVendor = async (id: string) => {
  const { data } = await apiClient.get(`/admin/vendors/${id}`);
  return data;
};

export const approveVendor = async (id: string) => {
  const { data } = await apiClient.patch(`/admin/vendors/${id}/approve`);
  return data;
};

export const suspendVendor = async (id: string) => {
  const { data } = await apiClient.patch(`/admin/vendors/${id}/suspend`);
  return data;
};

// Orders
export const getAdminOrders = async (params?: Record<string, any>) => {
  const { data } = await apiClient.get("/admin/orders", { params });
  return data;
};

export const getAdminOrder = async (id: string) => {
  const { data } = await apiClient.get(`/admin/orders/${id}`);
  return data;
};

export const updateOrderStatus = async (id: string, status: string) => {
  const { data } = await apiClient.patch(`/admin/orders/${id}/status`, { status });
  return data;
};

// System Config
export const getConfig = async () => {
  const { data } = await apiClient.get("/admin/config");
  return data;
};

export const updateConfig = async (payload: any) => {
  const { data } = await apiClient.put("/admin/config", payload);
  return data;
};


// Disputes
export const getAdminDisputes = async (params?: Record<string, any>) => {
  const { data } = await apiClient.get("/admin/disputes", { params });
  return data;
};

export const getAdminDispute = async (id: string) => {
  const { data } = await apiClient.get(`/admin/disputes/${id}`);
  return data;
};

export const resolveDispute = async (id: string, action: "REFUND" | "RELEASE", reason: string) => {
  const { data } = await apiClient.post(`/admin/disputes/${id}/resolve`, {
    action,
    reason,
  });
  return data;
};

// Reports
export const getRevenueReport = async (params?: Record<string, any>) => {
  const { data } = await apiClient.get("/admin/reports/revenue", { params });
  return data;
};

export const getUsersReport = async (params?: Record<string, any>) => {
  const { data } = await apiClient.get("/admin/reports/users", { params });
  return data;
};

export const getOrdersReport = async (params?: Record<string, any>) => {
  const { data } = await apiClient.get("/admin/reports/orders", { params });
  return data;
};
