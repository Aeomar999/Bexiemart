import { apiClient } from "./client";

export const login = async (credentials: { email: string; password: string }) => {
  const { data } = await apiClient.post("/auth/login", credentials);
  return data;
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
  // Assuming standard better-auth or custom endpoint. 
  // If better-auth, it might be /auth/change-password or similar. We'll use a placeholder or /auth/password
  const { data } = await apiClient.post("/auth/change-password", payload);
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
