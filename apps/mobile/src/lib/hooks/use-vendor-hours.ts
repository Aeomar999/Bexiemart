import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorHoursApi } from "../api/vendor-hours";

export const KEYS = { all: ["vendor-hours"] as const };

export function useVendorHours() {
  return useQuery({ queryKey: KEYS.all, queryFn: () => vendorHoursApi.getAll().then((r) => r.data) });
}

export function useUpdateVendorHours() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: vendorHoursApi.update, onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }) });
}
