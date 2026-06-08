import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addressesApi } from "../api/addresses";
import { useAddressStore } from "../stores/address-store";

export const ADDRESS_KEYS = {
  all: ["addresses"] as const,
};

export function useAddresses() {
  const setDefaultAddress = useAddressStore((s) => s.setDefaultAddress);

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
  const addAddress = useAddressStore((s) => s.addAddress);

  return useMutation({
    mutationFn: (data) => addressesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADDRESS_KEYS.all }),
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  const updateAddress = useAddressStore((s) => s.updateAddress);

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof addressesApi.update>[1]) =>
      addressesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADDRESS_KEYS.all }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  const deleteAddress = useAddressStore((s) => s.deleteAddress);

  return useMutation({
    mutationFn: (id: string) => addressesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADDRESS_KEYS.all }),
  });
}

export function useSetDefaultAddress() {
  const qc = useQueryClient();
  const setDefaultAddress = useAddressStore((s) => s.setDefaultAddress);

  return useMutation({
    mutationFn: (id: string) => addressesApi.setDefault(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADDRESS_KEYS.all }),
  });
}
