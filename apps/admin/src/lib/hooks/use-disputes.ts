import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ensureDisputeSupportTicket,
  getAdminDispute,
  getAdminDisputes,
  getDisputeSupportTicket,
  resolveDispute,
  sendSupportTicketMessage,
} from "../api/admin";

export const useDisputes = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ["disputes", params],
    queryFn: () => getAdminDisputes(params),
  });
};

export const useDispute = (id: string) => {
  return useQuery({
    queryKey: ["disputes", id],
    queryFn: () => getAdminDispute(id),
    enabled: !!id,
  });
};

export const useResolveDispute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: "REFUND" | "RELEASE"; reason: string }) => 
      resolveDispute(id, action, reason),
    onSuccess: (_, { id, action }) => {
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
      queryClient.invalidateQueries({ queryKey: ["disputes", id] });
      toast.success(`Dispute successfully resolved via ${action}`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to resolve dispute");
    }
  });
};

export const useDisputeSupportTicket = (id: string) => {
  return useQuery({
    queryKey: ["disputes", id, "support-ticket"],
    queryFn: () => getDisputeSupportTicket(id),
    enabled: !!id,
  });
};

export const useEnsureDisputeSupportTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ensureDisputeSupportTicket(id),
    onSuccess: (ticket, id) => {
      queryClient.setQueryData(["disputes", id, "support-ticket"], ticket);
      queryClient.invalidateQueries({ queryKey: ["admin", "support", "tickets"] });
      toast.success("Support chat is ready");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to open support chat");
    },
  });
};

export const useSendSupportTicketMessage = (disputeId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, content }: { ticketId: string; content: string }) =>
      sendSupportTicketMessage(ticketId, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["disputes", disputeId, "support-ticket"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "support", "tickets", variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "support", "tickets"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to send message");
    },
  });
};
