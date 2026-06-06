import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/auth";
import { useAuthStore } from "../stores/auth-store";

export const AUTH_KEYS = {
  currentUser: ["auth", "current-user"] as const,
};

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (response) => {
      setAuth(response.data.user as any, response.data.token);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: authApi.register,
  });
}

export function useCurrentUser() {
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const token = useAuthStore((s) => s.token);

  return useQuery({
    queryKey: AUTH_KEYS.currentUser,
    queryFn: async () => {
      const response = await authApi.getCurrentUser();
      const user = response.data?.user || null;
      if (user) {
        setUser(user as any);
      }
      return user;
    },
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: async (token: string) => {
      const result = await authApi.verifyEmail(token);
      return result;
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: async (email: string) => {
      const result = await authApi.resendVerificationEmail(email);
      return result;
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const clearCart = () => {};
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      logout();
      queryClient.clear();
    },
  });
}
