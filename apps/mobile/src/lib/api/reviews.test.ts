jest.mock("./client", () => ({
  apiClient: { post: jest.fn(), get: jest.fn(), delete: jest.fn() },
}));

import { reviewsApi } from "./reviews";
import { apiClient } from "./client";

describe("reviewsApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should create review", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: "review-1" } });
    const result = await reviewsApi.create({ productId: "prod-1", rating: 5, comment: "Great" });
    expect(apiClient.post).toHaveBeenCalledWith("/reviews", { productId: "prod-1", rating: 5, comment: "Great" });
    expect(result.data.id).toBe("review-1");
  });

  it("should find reviews by product", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [{ id: "1" }] } });
    const result = await reviewsApi.findByProduct("prod-1");
    expect(apiClient.get).toHaveBeenCalledWith("/reviews/product/prod-1");
    expect(result.data.data).toHaveLength(1);
  });

  it("should remove review", async () => {
    (apiClient.delete as jest.Mock).mockResolvedValue({ data: {} });
    await reviewsApi.remove("review-1");
    expect(apiClient.delete).toHaveBeenCalledWith("/reviews/review-1");
  });

  it("should handle error", async () => {
    (apiClient.post as jest.Mock).mockRejectedValue(new Error("Review failed"));
    await expect(reviewsApi.create({ productId: "prod-1", rating: 1 })).rejects.toThrow("Review failed");
  });
});
