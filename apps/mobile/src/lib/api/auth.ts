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
}

export const authApi = {
  login: async (data: LoginParams) => {
    const res = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    });
    if (res.error) throw res.error;
    return { data: { user: res.data.user as any, token: (res.data as any).session?.token || (res.data as any).session?.id || (res.data as any).token || 'better-auth-token' } };
  },

  register: async (data: RegisterParams) => {
    const res = await authClient.signUp.email({
      email: data.email,
      password: data.password,
      name: data.name,
      // @ts-ignore
      role: data.role,
    });
    if (res.error) throw res.error;
    return { data: { user: res.data.user as any, token: (res.data as any).session?.token || (res.data as any).session?.id || (res.data as any).token || 'better-auth-token' } };
  },

  getCurrentUser: async () => {
    const res = await authClient.getSession();
    if (res.error) throw res.error;
    return { data: { user: res.data?.user } };
  },

  forgotPassword: async (email: string) => {
    const res = await (authClient as any).forgetPassword({ email, redirectTo: 'bexiemart://reset-password' });
    if (res.error) throw res.error;
    return { data: res.data };
  },

  resetPassword: async (token: string, newPassword: string) => {
    const res = await authClient.resetPassword({ newPassword, token });
    if (res.error) throw res.error;
    return { data: res.data };
  },
};
