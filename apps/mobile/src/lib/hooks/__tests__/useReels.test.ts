import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/reels", () => ({
  reelsApi: {
    getReels: jest.fn(),
    getFollowing: jest.fn(),
    toggleLike: jest.fn(),
    incrementView: jest.fn(),
  },
}));;

import { useReels, useFollowingReels, useToggleReelLike, useIncrementReelView } from "../use-reels";
import { reelsApi } from "../../api/reels";
import { createWrapper } from "./test-utils";

describe("useReels", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch reels on mount", async () => {
    (reelsApi.getReels as jest.Mock).mockResolvedValue({ data: [{ id: "r1", url: "https://example.com/reel1.mp4" }] });
    const { result } = renderHook(() => useReels(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBeFalsy());
  });

  it("should return reels on success", async () => {
    (reelsApi.getReels as jest.Mock).mockResolvedValue({ data: [{ id: "r1", url: "https://example.com/reel1.mp4", likes: 42 }] });
    const { result} = renderHook(() => useReels(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([{ id: "r1", url: "https://example.com/reel1.mp4", likes: 42 }]);
  });

  it("should handle empty reels", async () => {
    (reelsApi.getReels as jest.Mock).mockResolvedValue({ data: [] });
    const { result} = renderHook(() => useReels(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([]);
  });

  it("should handle fetch error", async () => {
    (reelsApi.getReels as jest.Mock).mockRejectedValue(new Error("Network Error"));
    const { result} = renderHook(() => useReels(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.error).toBeDefined();
  });
});

describe("useToggleReelLike", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call toggleLike with reel id", async () => {
    (reelsApi.toggleLike as jest.Mock).mockResolvedValue({ data: { liked: true } });
    const { result} = renderHook(() => useToggleReelLike(), { wrapper: createWrapper() });
    await result.current.mutateAsync("r1");
    expect(reelsApi.toggleLike).toHaveBeenCalledWith("r1");
  });
});
