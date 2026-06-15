import { useQuery } from "@tanstack/react-query";
import { foodApi } from "../api/food";

export function useFoodVendors(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ["foodVendors", page, limit],
    queryFn: () => foodApi.getFoodVendors(page, limit),
  });
}

export function useFoodOrders(page: number = 1, limit: number = 20, status?: string) {
  return useQuery({
    queryKey: ["foodOrders", page, limit, status],
    queryFn: () => foodApi.getFoodOrders(page, limit, status),
  });
}
