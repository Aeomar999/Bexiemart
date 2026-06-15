import { useQuery } from "@tanstack/react-query";
import { servicesApi } from "../api/services";

export function useServiceVendors(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ["serviceVendors", page, limit],
    queryFn: () => servicesApi.getServiceVendors(page, limit),
  });
}

export function useServiceBookings(page: number = 1, limit: number = 20, status?: string) {
  return useQuery({
    queryKey: ["serviceBookings", page, limit, status],
    queryFn: () => servicesApi.getServiceBookings(page, limit, status),
  });
}
