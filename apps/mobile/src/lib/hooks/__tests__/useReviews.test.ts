import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/reviews", () => ({
  reviewsApi: {
    create: jest.fn(),
  },
}));;

import { useCreateReview } from "../use-reviews";
import { reviewsApi } from "../../api/reviews";
import { createWrapper } from "./test-utils";

describe("useCreateReview", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call create review mutation with product data", async () => {
    (reviewsApi.create as jest.Mock).mockResolvedValue({ data: { id: "r1", rating: 5 } });
    const { result} = renderHook(() => useCreateReview(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ productId: "p1", rating: 5, comment: "Great!" });
    expect(reviewsApi.create).toHaveBeenCalledWith({ productId: "p1", rating: 5, comment: "Great!" });
  });

  it("should handle create review error", async () => {
    (reviewsApi.create as jest.Mock).mockRejectedValue(new Error("Failed to submit review"));
    const { result} = renderHook(() => useCreateReview(), { wrapper: createWrapper() });
    result.current.mutate({ productId: "p1", rating: 2 });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("should pass comment field as optional", async () => {
    (reviewsApi.create as jest.Mock).mockResolvedValue({ data: { id: "r2", rating: 4 } });
    const { result} = renderHook(() => useCreateReview(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ productId: "p2", rating: 4 });
    expect(reviewsApi.create).toHaveBeenCalledWith({ productId: "p2", rating: 4 });
  });

  it("should handle invalid product id", async () => {
    (reviewsApi.create as jest.Mock).mockRejectedValue(new Error("Product not found"));
    const { result} = renderHook(() => useCreateReview(), { wrapper: createWrapper() });
    result.current.mutate({ productId: "invalid", rating: 5, comment: "Test" });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("should return created review data", async () => {
    const reviewData = { id: "r3", productId: "p1", rating: 5, comment: "Excellent" };
    (reviewsApi.create as jest.Mock).mockResolvedValue({ data: reviewData });
    const { result} = renderHook(() => useCreateReview(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ productId: "p1", rating: 5, comment: "Excellent" });
    await waitFor(() => {
      expect(result.current.data).toEqual(reviewData);
    });
  });

  it("should handle empty comment", async () => {
    (reviewsApi.create as jest.Mock).mockResolvedValue({ data: { id: "r4", rating: 3 } });
    const { result} = renderHook(() => useCreateReview(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ productId: "p3", rating: 3, comment: "" });
    expect(reviewsApi.create).toHaveBeenCalledWith({ productId: "p3", rating: 3, comment: "" });
  });
});
