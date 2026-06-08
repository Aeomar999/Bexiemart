jest.mock("./client", () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
}));

import { reelsApi } from "./reels";
import { apiClient } from "./client";

describe("reelsApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should get reels", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [{ id: "reel-1" }] } });
    const result = await reelsApi.getReels();
    expect(apiClient.get).toHaveBeenCalledWith("/reels");
    expect(result.data.data).toHaveLength(1);
  });

  it("should get following reels", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [{ id: "reel-2" }] } });
    const result = await reelsApi.getFollowing();
    expect(apiClient.get).toHaveBeenCalledWith("/reels/following");
    expect(result.data.data).toHaveLength(1);
  });

  it("should toggle like", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { liked: true } });
    const result = await reelsApi.toggleLike("reel-1");
    expect(apiClient.post).toHaveBeenCalledWith("/reels/reel-1/like");
    expect(result.data.liked).toBe(true);
  });

  it("should increment view", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { views: 101 } });
    const result = await reelsApi.incrementView("reel-1");
    expect(apiClient.post).toHaveBeenCalledWith("/reels/reel-1/view");
    expect(result.data.views).toBe(101);
  });
});
