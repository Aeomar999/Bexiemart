import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAdminDisputes, getAdminDispute, resolveDispute } from "../api/admin";

export const useDisputes = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ["disputes", params],
    queryFn: () => getAdminDisputes(params),
  });
};

export const useDispute = (id: string) => {
  return useQuery({
    queryKey: ["disputes", id],
    queryFn: () => getAdminDispute(id),
    enabled: !!id,
  });
};

export const useResolveDispute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: "REFUND" | "RELEASE"; reason: string }) => 
      resolveDispute(id, action, reason),
    onSuccess: (_, { id, action }) => {
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
      queryClient.invalidateQueries({ queryKey: ["disputes", id] });
      toast.success(`Dispute successfully resolved via ${action}`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to resolve dispute");
    }
  });
};
