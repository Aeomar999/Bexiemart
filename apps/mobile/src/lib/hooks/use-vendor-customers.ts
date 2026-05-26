import { useQuery } from "@tanstack/react-query";
import { vendorCustomersApi } from "../api/vendor-customers";

export const KEYS = { all: ["vendor-customers"] as const };

export function useVendorCustomers() {
  return useQuery({ queryKey: KEYS.all, queryFn: () => vendorCustomersApi.getAll().then((r) => r.data) });
}

export function useVendorCustomer(id: string) {
  return useQuery({ queryKey: [...KEYS.all, id], queryFn: () => vendorCustomersApi.getOne(id).then((r) => r.data) });
}
