import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supportApi, CreateTicketPayload, RateTicketPayload } from "../api/support";

export const SUPPORT_KEYS = {
  tickets: ["support", "tickets"] as const,
  ticket: (id: string) => ["support", "tickets", id] as const,
};

export function useSupportTickets(page = 1) {
  return useQuery({
    queryKey: [...SUPPORT_KEYS.tickets, page],
    queryFn: () => supportApi.getTickets(page).then((r) => r.data),
  });
}

export function useSupportTicket(ticketId: string) {
  return useQuery({
    queryKey: SUPPORT_KEYS.ticket(ticketId),
    queryFn: () => supportApi.getTicket(ticketId).then((r) => r.data),
    enabled: !!ticketId,
  });
}

export function useCreateSupportTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTicketPayload) => supportApi.createTicket(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPORT_KEYS.tickets });
    },
  });
}

export function useRateSupportTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, data }: { ticketId: string; data: RateTicketPayload }) =>
      supportApi.rateTicket(ticketId, data).then((r) => r.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: SUPPORT_KEYS.ticket(variables.ticketId) });
      queryClient.invalidateQueries({ queryKey: SUPPORT_KEYS.tickets });
    },
  });
}
