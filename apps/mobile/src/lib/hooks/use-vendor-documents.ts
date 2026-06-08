import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorDocumentsApi } from "../api/vendor-documents";

export const KEYS = { all: ["vendor-documents"] as const };

export function useVendorDocuments() {
  return useQuery({ queryKey: KEYS.all, queryFn: () => vendorDocumentsApi.getAll().then((r) => r.data) });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data) => vendorDocumentsApi.create(data), onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }) });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data) => vendorDocumentsApi.remove(data), onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }) });
}
