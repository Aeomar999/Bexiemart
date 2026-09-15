import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getUserFriendlyErrorMessage } from "@/lib/error-utils";
import { getAdminUsers, getAdminUser, updateUserRole } from "../api/admin";

export const useUsers = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => getAdminUsers(params),
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => getAdminUser(id),
    enabled: !!id,
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => updateUserRole(id, role),
    onSuccess: (_, { id, role }) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", id] });
      toast.success(`User role successfully updated to ${role}`);
    },
    onError: (error: any) => {
      toast.error(getUserFriendlyErrorMessage(error, "We couldn't change this user's role. Please try again."));
    }
  });
};
