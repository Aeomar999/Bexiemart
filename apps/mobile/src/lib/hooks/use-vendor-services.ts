import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorServicesApi } from "../api/vendor-services";

export const KEYS = { all: ["vendor-services"] as const };

export function useVendorServices() {
  return useQuery({ queryKey: KEYS.all, queryFn: () => vendorServicesApi.getAll().then((r) => r.data) });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: vendorServicesApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }) });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => vendorServicesApi.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }) });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: vendorServicesApi.remove, onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }) });
}
