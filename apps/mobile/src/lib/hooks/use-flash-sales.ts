import { useQuery } from "@tanstack/react-query";
import { flashSalesApi } from "../api/flash-sales";
export function useActiveFlashSales() {
  return useQuery({
    queryKey: ["flash-sales", "active"],
    queryFn: () => flashSalesApi.getActive().then((r) => r.data),
  });
}
