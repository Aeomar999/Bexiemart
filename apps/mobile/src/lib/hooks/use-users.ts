import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "../api/users";

export const USER_KEYS = {
  me: ["user", "me"] as const,
};

export function useMe() {
  return useQuery({
    queryKey: USER_KEYS.me,
    queryFn: async () => {
      const r = await usersApi.getMe();
      return r.data;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: { name?: string; image?: string; onboardingCompleted?: boolean }) =>
      usersApi.updateProfile(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: USER_KEYS.me }),
  });
}
