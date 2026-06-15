import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAdminOrders, getAdminOrder, updateOrderStatus } from "../api/admin";

export const useOrders = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => getAdminOrders(params),
  });
};

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => getAdminOrder(id),
    enabled: !!id,
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateOrderStatus(id, status),
    onSuccess: (_, { id, status }) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", id] });
      toast.success(`Order status updated to ${status}`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update order status");
    }
  });
};
