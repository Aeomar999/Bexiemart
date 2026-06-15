import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { marketingApi } from "../api/marketing";

export function useFlashSales(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ["flashSales", page, limit],
    queryFn: () => marketingApi.getFlashSales(page, limit),
  });
}

export function useCreateFlashSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: any) => marketingApi.createFlashSale(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashSales"] });
    },
  });
}

export function useCoupons(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ["coupons", page, limit],
    queryFn: () => marketingApi.getCoupons(page, limit),
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: any) => marketingApi.createCoupon(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
}
