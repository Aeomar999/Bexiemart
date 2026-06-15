import { useMutation, useQuery } from "@tanstack/react-query";
import { login, getMe } from "../api/auth";
import { useAuthStore } from "../stores/auth-store";

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth(data.user, data.token);
    },
  });
}

export function useUser() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    enabled: !!token,
  });
}
