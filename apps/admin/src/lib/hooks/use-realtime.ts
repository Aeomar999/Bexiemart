import { useQueryClient } from "@tanstack/react-query";
import { useSocketEvent } from "./use-socket";
import { toast } from "sonner";

export function useAdminRealtimeUpdates() {
  const queryClient = useQueryClient();

  useSocketEvent("order.created", (data: any) => {
    toast.info("New order received", {
      description: `Order #${data.orderId} was just placed.`,
    });
    // Invalidate orders and dashboard stats
    queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "dashboard", "stats"] });
  });

  useSocketEvent("vendor.registered", (data: any) => {
    toast.info("New vendor registration", {
      description: `${data.businessName} just registered.`,
    });
    queryClient.invalidateQueries({ queryKey: ["admin", "vendors"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "dashboard", "stats"] });
  });

  useSocketEvent("dispute.created", (data: any) => {
    toast.warning("New dispute opened", {
      description: `Dispute #${data.disputeId} needs attention.`,
    });
    queryClient.invalidateQueries({ queryKey: ["admin", "disputes"] });
  });
}
