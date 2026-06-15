import { apiClient } from "./client";

export const login = async (credentials: { email: string; password: string }) => {
  const { data } = await apiClient.post("/auth/login", credentials);
  return data;
};

export const getMe = async () => {
  const { data } = await apiClient.get("/users/me");
  return data;
};
