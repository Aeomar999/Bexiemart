import { apiClient } from "./client";

interface LoginParams {
  email: string;
  password: string;
}

interface RegisterParams {
  email: string;
  password: string;
  name: string;
  role: string;
}

export const authApi = {
  login: (data: LoginParams) =>
    apiClient.post<{ user: any; token: string }>("/auth/login", data),

  register: (data: RegisterParams) =>
    apiClient.post<{ user: any; token: string }>("/auth/register", data),

  getCurrentUser: () => apiClient.get<{ user: any }>("/auth/me"),

  forgotPassword: (email: string) =>
    apiClient.post("/auth/forgot-password", { email }),

  resetPassword: (token: string, newPassword: string) =>
    apiClient.post("/auth/reset-password", { token, newPassword }),
};
