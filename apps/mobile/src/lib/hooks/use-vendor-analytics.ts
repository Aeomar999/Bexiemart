import { useQuery } from "@tanstack/react-query";
import { vendorAnalyticsApi } from "../api/vendor-documents";

export const KEYS = { analytics: ["vendor-analytics"] as const, transactions: ["vendor-transactions"] as const };

export function useVendorAnalytics() {
  return useQuery({ queryKey: KEYS.analytics, queryFn: () => vendorAnalyticsApi.getAnalytics().then((r) => r.data) });
}

export function useVendorTransactions() {
  return useQuery({ queryKey: KEYS.transactions, queryFn: () => vendorAnalyticsApi.getTransactions().then((r) => r.data) });
}
