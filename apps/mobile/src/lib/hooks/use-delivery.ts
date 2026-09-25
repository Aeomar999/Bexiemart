import { useQuery } from "@tanstack/react-query";
import { deliveryApi } from "../api/delivery";

const TERMINAL_STATUSES = ["DELIVERED", "CANCELLED", "EXPIRED"];

export const isActiveDeliveryStatus = (status: string) => !TERMINAL_STATUSES.includes(status);

export const DELIVERY_KEYS = {
  latestActive: ["delivery", "jobs", "latest-active"] as const,
};

/** The customer's most recent delivery job that hasn't finished, or null. */
export function useActiveDelivery({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: DELIVERY_KEYS.latestActive,
    queryFn: async () => {
      const { data } = await deliveryApi.myJobs();
      return data.jobs.find((j) => isActiveDeliveryStatus(j.status)) ?? null;
    },
    enabled,
  });
}
