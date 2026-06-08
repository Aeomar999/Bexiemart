import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/vendor-documents", () => ({
  vendorAnalyticsApi: {
    getAnalytics: jest.fn(),
    getTransactions: jest.fn() },
}));

import { useVendorAnalytics, useVendorTransactions } from "../use-vendor-analytics";
import { vendorAnalyticsApi } from "../../api/vendor-documents";
import { createWrapper } from "./test-utils";

describe("useVendorAnalytics", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch dashboard analytics on mount", async () => {
    (vendorAnalyticsApi.getAnalytics as jest.Mock).mockResolvedValue({ data: { totalRevenue: 1000000, orderCount: 200, averageRating: 4.3 } });
    const { result} = renderHook(() => useVendorAnalytics(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual({ totalRevenue: 1000000, orderCount: 200, averageRating: 4.3 });
  });

  it("should handle fetch error", async () => {
    (vendorAnalyticsApi.getAnalytics as jest.Mock).mockRejectedValue(new Error("Network Error"));
    const { result} = renderHook(() => useVendorAnalytics(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.error).toBeDefined();
  });
});

describe("useVendorTransactions", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch revenue/transactions data", async () => {
    (vendorAnalyticsApi.getTransactions as jest.Mock).mockResolvedValue({ data: [{ id: "t1", amount: 50000, type: "sale" }] });
    const { result} = renderHook(() => useVendorTransactions(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([{ id: "t1", amount: 50000, type: "sale" }]);
  });
});
