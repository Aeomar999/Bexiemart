import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/reels", () => ({
  reelsApi: {
    getReels: jest.fn(),
    getFollowing: jest.fn(),
    toggleLike: jest.fn(),
    incrementView: jest.fn(),
    listComments: jest.fn(),
    addComment: jest.fn(),
  },
}));

import {
  useReels,
  useFollowingReels,
  useToggleReelLike,
  useIncrementReelView,
  useReelComments,
  useAddReelComment,
} from "../use-reels";
import { reelsApi } from "../../api/reels";
import { createWrapper } from "./test-utils";

describe("useReels", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch reels on mount", async () => {
    (reelsApi.getReels as jest.Mock).mockResolvedValue({
      data: [{ id: "r1", url: "https://example.com/reel1.mp4" }],
    });
    const { result } = renderHook(() => useReels(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBeFalsy());
  });

  it("should return reels on success", async () => {
    (reelsApi.getReels as jest.Mock).mockResolvedValue({
      data: [{ id: "r1", url: "https://example.com/reel1.mp4", likes: 42 }],
    });
    const { result } = renderHook(() => useReels(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data?.pages[0]).toEqual([
      { id: "r1", url: "https://example.com/reel1.mp4", likes: 42 },
    ]);
  });

  it("should handle empty reels", async () => {
    (reelsApi.getReels as jest.Mock).mockResolvedValue({ data: [] });
    const { result } = renderHook(() => useReels(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data?.pages[0]).toEqual([]);
  });

  it("should handle fetch error", async () => {
    (reelsApi.getReels as jest.Mock).mockRejectedValue(new Error("Network Error"));
    const { result } = renderHook(() => useReels(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.error).toBeDefined();
  });
});

describe("useToggleReelLike", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call toggleLike with reel id", async () => {
    (reelsApi.toggleLike as jest.Mock).mockResolvedValue({ data: { liked: true } });
    const { result } = renderHook(() => useToggleReelLike(), { wrapper: createWrapper() });
    await result.current.mutateAsync("r1");
    expect(reelsApi.toggleLike).toHaveBeenCalledWith("r1");
  });
});

describe("useReelComments", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch comments when reelId is provided", async () => {
    (reelsApi.listComments as jest.Mock).mockResolvedValue({
      data: [{ id: "c1", content: "Great reel!" }],
    });
    const { result } = renderHook(() => useReelComments("r1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(reelsApi.listComments).toHaveBeenCalledWith("r1");
    expect(result.current.data).toEqual([{ id: "c1", content: "Great reel!" }]);
  });
});

describe("useAddReelComment", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call addComment with reelId and content", async () => {
    (reelsApi.addComment as jest.Mock).mockResolvedValue({
      data: { id: "c2", content: "Nice video" },
    });
    const { result } = renderHook(() => useAddReelComment(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ reelId: "r1", content: "Nice video" });
    expect(reelsApi.addComment).toHaveBeenCalledWith("r1", "Nice video");
  });
});
