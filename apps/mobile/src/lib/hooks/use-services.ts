import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { servicesApi } from "../api/services";

export function useServices(params?: { category?: string; search?: string }) {
  return useQuery({
    queryKey: ["services", params],
    queryFn: () => servicesApi.getServices(params).then((r) => r.data),
  });
}

export function useService(id: string) {
  return useQuery({
    queryKey: ["services", id],
    queryFn: () => servicesApi.getService(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useBookService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; message?: string; scheduledAt?: string }) =>
      servicesApi.bookService(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services", "bookings"] });
    },
  });
}

export function useServiceBookings() {
  return useQuery({
    queryKey: ["services", "bookings"],
    queryFn: () => servicesApi.getBookings().then((r) => r.data),
  });
}

export function useCancelServiceBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => servicesApi.cancelBooking(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services", "bookings"] }),
  });
}
