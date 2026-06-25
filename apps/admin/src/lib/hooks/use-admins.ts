import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdmins, createAdmin } from "../api/admin";

export function useAdmins() {
  return useQuery({
    queryKey: ["admin", "admins"],
    queryFn: getAdmins,
  });
}

export function useCreateAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "admins"] });
    },
  });
}
