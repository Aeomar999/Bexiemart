import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/vendor-reviews", () => ({
  vendorReviewsApi: {
    getAll: jest.fn(),
    reply: jest.fn(),
  },
}));;

import { useVendorReviews, useReplyToReview } from "../use-vendor-reviews";
import { vendorReviewsApi } from "../../api/vendor-reviews";
import { createWrapper } from "./test-utils";

describe("useVendorReviews", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch vendor reviews on mount", async () => {
    (vendorReviewsApi.getAll as jest.Mock).mockResolvedValue({ data: [{ id: "r1", rating: 5, comment: "Great!" }] });
    const { result} = renderHook(() => useVendorReviews(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([{ id: "r1", rating: 5, comment: "Great!" }]);
  });

  it("should handle fetch error", async () => {
    (vendorReviewsApi.getAll as jest.Mock).mockRejectedValue(new Error("Network Error"));
    const { result} = renderHook(() => useVendorReviews(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.error).toBeDefined();
  });
});

describe("useReplyToReview", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should reply to review mutation", async () => {
    (vendorReviewsApi.reply as jest.Mock).mockResolvedValue({ data: { success: true } });
    const { result} = renderHook(() => useReplyToReview(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "r1", reply: "Thank you!" });
    expect(vendorReviewsApi.reply).toHaveBeenCalledWith("r1", "Thank you!");
  });
});
