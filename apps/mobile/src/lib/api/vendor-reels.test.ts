jest.mock("./client", () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

import { vendorReelsApi } from "./vendor-reels";
import { apiClient } from "./client";

describe("vendorReelsApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should get all reels", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [{ id: "reel-1" }] } });
    const result = await vendorReelsApi.getAll();
    expect(apiClient.get).toHaveBeenCalledWith("/vendor/reels");
    expect(result.data.data).toHaveLength(1);
  });

  it("should get single reel", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { id: "reel-1", url: "http://video.mp4" } });
    const result = await vendorReelsApi.getOne("reel-1");
    expect(apiClient.get).toHaveBeenCalledWith("/vendor/reels/reel-1");
    expect(result.data.url).toBe("http://video.mp4");
  });

  it("should create reel", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: "reel-1" } });
    const result = await vendorReelsApi.create({ title: "New Reel", video: "url" });
    expect(apiClient.post).toHaveBeenCalledWith("/vendor/reels", { title: "New Reel", video: "url" });
    expect(result.data.id).toBe("reel-1");
  });

  it("should remove reel", async () => {
    (apiClient.delete as jest.Mock).mockResolvedValue({ data: {} });
    await vendorReelsApi.remove("reel-1");
    expect(apiClient.delete).toHaveBeenCalledWith("/vendor/reels/reel-1");
  });
});
