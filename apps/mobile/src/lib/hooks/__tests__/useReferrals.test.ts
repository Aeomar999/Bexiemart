import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/referrals", () => ({
  referralsApi: {
    getProfile: jest.fn(),
    getStats: jest.fn(),
    generate: jest.fn(),
    apply: jest.fn(),
  },
}));;

import { useReferralProfile, useReferralStats, useGenerateReferralCode, useApplyReferralCode } from "../use-referrals";
import { referralsApi } from "../../api/referrals";
import { createWrapper } from "./test-utils";

describe("useReferralProfile", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch referral profile on mount", async () => {
    (referralsApi.getProfile as jest.Mock).mockResolvedValue({ data: { code: "REF123", referralCount: 5 } });
    const { result} = renderHook(() => useReferralProfile(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual({ code: "REF123", referralCount: 5 });
  });

  it("should handle fetch error", async () => {
    (referralsApi.getProfile as jest.Mock).mockRejectedValue(new Error("Network Error"));
    const { result} = renderHook(() => useReferralProfile(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.error).toBeDefined();
  });
});

describe("useReferralStats", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch referral earnings stats", async () => {
    (referralsApi.getStats as jest.Mock).mockResolvedValue({ data: { totalEarnings: 5000, pendingBonus: 1000 } });
    const { result} = renderHook(() => useReferralStats(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual({ totalEarnings: 5000, pendingBonus: 1000 });
  });
});

describe("useGenerateReferralCode", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should generate referral code mutation", async () => {
    (referralsApi.generate as jest.Mock).mockResolvedValue({ data: { code: "NEWCODE" } });
    const { result} = renderHook(() => useGenerateReferralCode(), { wrapper: createWrapper() });
    await result.current.mutateAsync();
    expect(referralsApi.generate).toHaveBeenCalled();
  });
});
