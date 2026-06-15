import { useQuery } from "@tanstack/react-query";
import { getRevenueReport, getUsersReport, getOrdersReport } from "../api/admin";

export const useRevenueReport = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ["revenueReport", params],
    queryFn: () => getRevenueReport(params),
  });
};

export const useUsersReport = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ["usersReport", params],
    queryFn: () => getUsersReport(params),
  });
};

export const useOrdersReport = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ["ordersReport", params],
    queryFn: () => getOrdersReport(params),
  });
};
