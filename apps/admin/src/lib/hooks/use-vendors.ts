import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAdminVendors, getAdminVendor, approveVendor, suspendVendor } from "../api/admin";

export const useVendors = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ["vendors", params],
    queryFn: () => getAdminVendors(params),
  });
};

export const useVendor = (id: string) => {
  return useQuery({
    queryKey: ["vendors", id],
    queryFn: () => getAdminVendor(id),
    enabled: !!id,
  });
};

export const useApproveVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => approveVendor(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      queryClient.invalidateQueries({ queryKey: ["vendors", id] });
      toast.success("Vendor successfully approved!");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to approve vendor");
    }
  });
};

export const useSuspendVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => suspendVendor(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      queryClient.invalidateQueries({ queryKey: ["vendors", id] });
      toast.success("Vendor has been suspended.");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to suspend vendor");
    }
  });
};
