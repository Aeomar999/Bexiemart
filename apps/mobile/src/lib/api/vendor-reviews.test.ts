jest.mock("./client", () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
}));

import { vendorReviewsApi } from "./vendor-reviews";
import { apiClient } from "./client";

describe("vendorReviewsApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should get all reviews", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [{ id: "rev-1", rating: 5 }] } });
    const result = await vendorReviewsApi.getAll();
    expect(apiClient.get).toHaveBeenCalledWith("/vendor/reviews");
    expect(result.data.data).toHaveLength(1);
  });

  it("should reply to review", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: "rev-1", reply: "Thank you" } });
    const result = await vendorReviewsApi.reply("rev-1", "Thank you");
    expect(apiClient.post).toHaveBeenCalledWith("/vendor/reviews/rev-1/reply", { reply: "Thank you" });
    expect(result.data.reply).toBe("Thank you");
  });

  it("should handle error", async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error("Network error"));
    await expect(vendorReviewsApi.getAll()).rejects.toThrow("Network error");
  });
});
