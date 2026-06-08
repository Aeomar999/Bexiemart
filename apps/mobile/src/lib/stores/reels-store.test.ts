jest.mock("../api/reels", () => ({
  reelsApi: {
    getReels: jest.fn(),
    toggleLike: jest.fn(),
    incrementView: jest.fn(),
  },
}));
jest.mock("../logger", () => ({ logger: { error: jest.fn() } }));

import { useReelsStore } from "./reels-store";
import { reelsApi } from "../api/reels";

const mockReels = {
  data: [
    {
      id: "r1", vendorId: "v1", vendorName: "Vendor 1", description: "Check this out!",
      videoUrl: "vid1.mp4", likes: 100, comments: [], shares: 5, isLiked: false, isFollowing: false,
      product: { id: "p1", name: "Product 1", price: 50 },
    },
    {
      id: "r2", vendorId: "v2", vendorName: "Vendor 2", description: "Amazing!",
      videoUrl: "vid2.mp4", likes: 200, comments: [], shares: 10, isLiked: true, isFollowing: true,
      product: { id: "p2", name: "Product 2", price: 100 },
    },
  ],
};

describe("Reels Store", () => {
  beforeEach(() => {
    useReelsStore.setState({ reels: [], isLoading: false });
    jest.clearAllMocks();
  });

  it("should fetch reels", async () => {
    (reelsApi.getReels as jest.Mock).mockResolvedValue(mockReels);
    await useReelsStore.getState().fetchReels();
    expect(useReelsStore.getState().reels).toHaveLength(2);
    expect(useReelsStore.getState().isLoading).toBe(false);
  });

  it("should handle fetch error", async () => {
    (reelsApi.getReels as jest.Mock).mockRejectedValue(new Error("network"));
    await useReelsStore.getState().fetchReels();
    expect(useReelsStore.getState().isLoading).toBe(false);
  });

  it("should toggle like optimistically", async () => {
    useReelsStore.setState({ reels: mockReels.data });
    (reelsApi.toggleLike as jest.Mock).mockResolvedValue({});
    await useReelsStore.getState().toggleLikeReel("r1");
    const reel = useReelsStore.getState().reels.find((r) => r.id === "r1")!;
    expect(reel.isLiked).toBe(true);
    expect(reel.likes).toBe(101);
    expect(reelsApi.toggleLike).toHaveBeenCalledWith("r1");
  });

  it("should toggle like off", async () => {
    useReelsStore.setState({ reels: mockReels.data });
    (reelsApi.toggleLike as jest.Mock).mockResolvedValue({});
    await useReelsStore.getState().toggleLikeReel("r2");
    const reel = useReelsStore.getState().reels.find((r) => r.id === "r2")!;
    expect(reel.isLiked).toBe(false);
    expect(reel.likes).toBe(199);
  });

  it("should toggle follow vendor for all matching reels", () => {
    useReelsStore.setState({ reels: mockReels.data });
    useReelsStore.getState().toggleFollowVendor("v1");
    const reels = useReelsStore.getState().reels;
    expect(reels.find((r) => r.vendorId === "v1")!.isFollowing).toBe(true);
    expect(reels.find((r) => r.vendorId === "v2")!.isFollowing).toBe(true);
  });

  it("should add comment to reel", () => {
    useReelsStore.setState({ reels: mockReels.data });
    useReelsStore.getState().addComment("r1", "Nice!");
    const reel = useReelsStore.getState().reels.find((r) => r.id === "r1")!;
    expect(reel.comments).toHaveLength(1);
    expect(reel.comments[0].text).toBe("Nice!");
    expect(reel.comments[0].username).toBe("you");
  });

  it("should increment share count", () => {
    useReelsStore.setState({ reels: mockReels.data });
    useReelsStore.getState().incrementShare("r1");
    expect(useReelsStore.getState().reels[0].shares).toBe(6);
  });

  it("should increment view via API", async () => {
    (reelsApi.incrementView as jest.Mock).mockResolvedValue({});
    await useReelsStore.getState().incrementView("r1");
    expect(reelsApi.incrementView).toHaveBeenCalledWith("r1");
  });

  it("should add reel to beginning", () => {
    useReelsStore.setState({ reels: mockReels.data });
    const newReel = { id: "r3", vendorId: "v3", vendorName: "V3", description: "New!", videoUrl: "v3.mp4", likes: 0, comments: [], shares: 0, isLiked: false, isFollowing: false, product: { id: "p3", name: "P3", price: 30 } };
    useReelsStore.getState().addReel(newReel);
    expect(useReelsStore.getState().reels).toHaveLength(3);
    expect(useReelsStore.getState().reels[0].id).toBe("r3");
  });
});
