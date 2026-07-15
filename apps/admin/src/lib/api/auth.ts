import { apiClient } from "./client";

export const login = async (credentials: { email: string; password: string }) => {
  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Login failed");
  return data; // { user } or { requiresTwoFactor: true }
};

export const getMe = async () => {
  const { data } = await apiClient.get("/users/me");
  return data;
};

export const updateProfile = async (payload: { name?: string; image?: string }) => {
  const { data } = await apiClient.patch("/users/profile", payload);
  return data;
};

export const updatePassword = async (payload: { currentPassword?: string; newPassword?: string }) => {
  const { data } = await apiClient.post("/auth/change-password", {
    currentPassword: payload.currentPassword,
    newPassword: payload.newPassword,
    revokeOtherSessions: true,
  });
  return data;
};

export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data; // { url, public_id, filename }
};
