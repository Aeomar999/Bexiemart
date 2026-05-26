import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorCouponsApi } from "../api/vendor-coupons";

export const KEYS = { all: ["vendor-coupons"] as const };

export function useVendorCoupons() {
  return useQuery({ queryKey: KEYS.all, queryFn: () => vendorCouponsApi.getAll().then((r) => r.data) });
}

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: vendorCouponsApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }) });
}

export function useUpdateCoupon() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => vendorCouponsApi.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }) });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: vendorCouponsApi.remove, onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }) });
}

export function useToggleCoupon() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: vendorCouponsApi.toggle, onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }) });
}
