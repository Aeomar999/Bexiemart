import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addressesApi } from "../api/addresses";

export const ADDRESS_KEYS = {
  all: ["addresses"] as const,
};

export function useAddresses() {
  return useQuery({
    queryKey: ADDRESS_KEYS.all,
    queryFn: async () => {
      const r = await addressesApi.getAll();
      return r.data;
    },
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof addressesApi.create>[0]) => addressesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADDRESS_KEYS.all }),
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof addressesApi.update>[1]) =>
      addressesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADDRESS_KEYS.all }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => addressesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADDRESS_KEYS.all }),
  });
}

export function useSetDefaultAddress() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => addressesApi.setDefault(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADDRESS_KEYS.all }),
  });
}
