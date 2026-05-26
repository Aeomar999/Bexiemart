import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorStaffApi } from "../api/vendor-staff";

export const KEYS = { all: ["vendor-staff"] as const };

export function useVendorStaff() {
  return useQuery({ queryKey: KEYS.all, queryFn: () => vendorStaffApi.getAll().then((r) => r.data) });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: vendorStaffApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }) });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => vendorStaffApi.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }) });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: vendorStaffApi.remove, onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }) });
}

export function useToggleStaff() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: vendorStaffApi.toggle, onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }) });
}
