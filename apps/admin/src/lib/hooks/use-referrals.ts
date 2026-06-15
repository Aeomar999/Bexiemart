import { useQuery } from "@tanstack/react-query";
import { referralsApi } from "../api/referrals";

export function useReferrals(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ["referrals", page, limit],
    queryFn: () => referralsApi.getReferrals(page, limit),
  });
}
