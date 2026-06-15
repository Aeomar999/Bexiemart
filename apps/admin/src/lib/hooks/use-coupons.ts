import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listCoupons, createCoupon } from "../api/admin";

export const useCoupons = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ["admin-coupons", params],
    queryFn: () => listCoupons(params),
  });
};

export const useCreateCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: any) => createCoupon(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("Coupon created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create coupon");
    }
  });
};
