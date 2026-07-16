import { useMutation, useQuery } from "@tanstack/react-query";
import { login, getMe } from "../api/auth";
import { useAuthStore } from "../stores/auth-store";

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      if (data.user) setAuth(data.user);
      // requiresTwoFactor is handled by the login page (Task 19)
    },
  });
}

export function useUser() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    enabled: isAuthenticated,
  });
}
