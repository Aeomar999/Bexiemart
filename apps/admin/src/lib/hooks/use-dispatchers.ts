import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dispatchersApi } from "../api/dispatchers";

export function useDispatchers(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["dispatchers", params],
    queryFn: () => dispatchersApi.getDispatchers(params),
  });
}

export function useDispatcher(id: string) {
  return useQuery({
    queryKey: ["dispatcher", id],
    queryFn: () => dispatchersApi.getDispatcher(id),
    enabled: !!id,
  });
}

export function useUpdateDispatcherStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      dispatchersApi.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dispatchers"] });
      queryClient.invalidateQueries({ queryKey: ["dispatcher", variables.id] });
    },
  });
}

export function useDeliveries(page: number = 1, limit: number = 20, status?: string) {
  return useQuery({
    queryKey: ["deliveries", page, limit, status],
    queryFn: () => dispatchersApi.getDeliveries(page, limit, status),
  });
}
