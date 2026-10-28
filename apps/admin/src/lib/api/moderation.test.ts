import { apiClient } from "./client";
import { moderationApi } from "./moderation";

jest.mock("./client", () => ({
  apiClient: {
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

describe("moderation API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getReels", () => {
    it("should list reels for moderation", async () => {
      const mockData = { data: [], meta: { total: 0 } };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await moderationApi.getReels();

      expect(apiClient.get).toHaveBeenCalledWith("/admin/content/reels", {
        params: { page: 1, limit: 20 },
      });
      expect(result).toEqual(mockData);
    });
  });

  describe("toggleReelStatus", () => {
    it("should toggle reel status", async () => {
      const mockData = { id: "r1", status: "hidden" };
      (apiClient.patch as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await moderationApi.toggleReelStatus("r1");

      expect(apiClient.patch).toHaveBeenCalledWith(
        "/admin/content/reels/r1/toggle-status"
      );
      expect(result).toEqual(mockData);
    });
  });

  describe("getReviews", () => {
    it("should list reviews for moderation", async () => {
      const mockData = { data: [], meta: { total: 0 } };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await moderationApi.getReviews();

      expect(apiClient.get).toHaveBeenCalledWith("/admin/content/reviews", {
        params: { page: 1, limit: 20 },
      });
      expect(result).toEqual(mockData);
    });
  });

  describe("deleteReview", () => {
    it("should delete a review", async () => {
      const mockData = { success: true };
      (apiClient.patch as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await moderationApi.deleteReview("r1");

      expect(apiClient.patch).toHaveBeenCalledWith("/admin/content/reviews/r1/delete");
      expect(result).toEqual(mockData);
    });
  });
});
