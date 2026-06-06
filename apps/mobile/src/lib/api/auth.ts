import { apiClient } from "./client";
import { authClient } from "./better-auth";

interface LoginParams {
  email: string;
  password: string;
}

interface RegisterParams {
  email: string;
  password: string;
  name: string;
  role: string;
  phone?: string;
}

export const authApi = {
  login: async (data: LoginParams) => {
    const res = await apiClient.post("/auth/login", data);
    return res;
  },

  register: async (data: RegisterParams) => {
    const res = await apiClient.post("/auth/register", data);
    return res;
  },

  getCurrentUser: async () => {
    const res = await apiClient.get("/auth/me");
    return res;
  },

  forgotPassword: async (email: string) => {
    const res = await (authClient as any).forgetPassword({
      email,
      redirectTo: "bexiemart://reset-password",
    });
    if (res.error) throw res.error;
    return { data: res.data };
  },

  resetPassword: async (token: string, newPassword: string) => {
    const res = await authClient.resetPassword({ newPassword, token });
    if (res.error) throw res.error;
    return { data: res.data };
  },

  verifyEmail: async (token: string) => {
    const res = await authClient.verifyEmail({ query: { token } });
    if (res.error) throw res.error;
    return res;
  },

  resendVerificationEmail: async (email: string) => {
    const res = await apiClient.post("/auth/resend-verification", { email });
    return res;
  },
};
