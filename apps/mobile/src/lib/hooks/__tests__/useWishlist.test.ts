import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/wishlist", () => ({
  wishlistApi: {
    getWishlist: jest.fn(),
    toggleWishlist: jest.fn(),
  },
}));;

import { useWishlist, useToggleWishlist } from "../use-wishlist";
import { wishlistApi } from "../../api/wishlist";
import { createWrapper } from "./test-utils";

describe("useWishlist", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch wishlist on mount", async () => {
    (wishlistApi.getWishlist as jest.Mock).mockResolvedValue({ data: { data: [{ id: "p1", name: "Product" }] } });
    const { result } = renderHook(() => useWishlist(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBeFalsy());
  });

  it("should return wishlist items on success", async () => {
    (wishlistApi.getWishlist as jest.Mock).mockResolvedValue({ data: { data: [{ id: "p1", name: "Product" }] } });
    const { result} = renderHook(() => useWishlist(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([{ id: "p1", name: "Product" }]);
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle empty wishlist", async () => {
    (wishlistApi.getWishlist as jest.Mock).mockResolvedValue({ data: { data: [] } });
    const { result} = renderHook(() => useWishlist(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([]);
  });

  it("should handle fetch error", async () => {
    (wishlistApi.getWishlist as jest.Mock).mockRejectedValue(new Error("Network Error"));
    const { result} = renderHook(() => useWishlist(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.error).toBeDefined();
  });
});

describe("useToggleWishlist", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call toggleWishlist with product id", async () => {
    (wishlistApi.toggleWishlist as jest.Mock).mockResolvedValue({ data: { added: true } });
    const { result} = renderHook(() => useToggleWishlist(), { wrapper: createWrapper() });
    await result.current.mutateAsync("p1");
    expect(wishlistApi.toggleWishlist).toHaveBeenCalledWith("p1");
  });

  it("should handle toggle error", async () => {
    (wishlistApi.toggleWishlist as jest.Mock).mockRejectedValue(new Error("Failed to toggle"));
    const { result} = renderHook(() => useToggleWishlist(), { wrapper: createWrapper() });
    result.current.mutate("p1");
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("should return toggle result", async () => {
    (wishlistApi.toggleWishlist as jest.Mock).mockResolvedValue({ data: { added: false } });
    const { result} = renderHook(() => useToggleWishlist(), { wrapper: createWrapper() });
    await result.current.mutateAsync("p2");
    await waitFor(() => {
      expect(result.current.data).toEqual({ added: false });
    });
  });
});
