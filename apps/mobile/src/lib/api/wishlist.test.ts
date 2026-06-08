jest.mock("./client", () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
}));

import { wishlistApi } from "./wishlist";
import { apiClient } from "./client";

describe("wishlistApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should get wishlist", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [{ id: "prod-1" }] } });
    const result = await wishlistApi.getWishlist();
    expect(apiClient.get).toHaveBeenCalledWith("/wishlist");
    expect(result.data.data).toHaveLength(1);
  });

  it("should toggle wishlist item", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { added: true } });
    const result = await wishlistApi.toggleWishlist("prod-1");
    expect(apiClient.post).toHaveBeenCalledWith("/wishlist/prod-1/toggle");
    expect(result.data.added).toBe(true);
  });

  it("should handle error", async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error("Network error"));
    await expect(wishlistApi.getWishlist()).rejects.toThrow("Network error");
  });
});
