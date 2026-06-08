jest.mock("./client", () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
}));

import { referralsApi } from "./referrals";
import { apiClient } from "./client";

describe("referralsApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should get referral profile", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { code: "REF123", earnings: 50 } });
    const result = await referralsApi.getProfile();
    expect(apiClient.get).toHaveBeenCalledWith("/referrals");
    expect(result.data.code).toBe("REF123");
  });

  it("should generate referral code", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { code: "NEW123" } });
    const result = await referralsApi.generate();
    expect(apiClient.post).toHaveBeenCalledWith("/referrals/generate");
    expect(result.data.code).toBe("NEW123");
  });

  it("should apply referral code", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { success: true } });
    const result = await referralsApi.apply("REF123");
    expect(apiClient.post).toHaveBeenCalledWith("/referrals/apply", { code: "REF123" });
    expect(result.data.success).toBe(true);
  });

  it("should handle error", async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error("Network error"));
    await expect(referralsApi.getProfile()).rejects.toThrow("Network error");
  });
});
