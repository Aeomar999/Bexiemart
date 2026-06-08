import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/vendor", () => ({
  vendorApi: {
    getProfile: jest.fn(),
    getStats: jest.fn(),
    getProducts: jest.fn(),
    getOrders: jest.fn(),
    getEarnings: jest.fn(),
    createProduct: jest.fn(),
    updateProduct: jest.fn(),
    deleteProduct: jest.fn(),
    getOrder: jest.fn(),
    updateOrderStatus: jest.fn(),
    withdraw: jest.fn(),
    updateShop: jest.fn(),
  },
}));;

import { useVendorProfile, useVendorStats, useVendorProducts, useVendorOrders, useVendorEarnings, useCreateProduct, useUpdateProduct, useUpdateShop } from "../use-vendor";
import { vendorApi } from "../../api/vendor";
import { createWrapper } from "./test-utils";

describe("useVendorProfile", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch vendor profile on mount", async () => {
    (vendorApi.getProfile as jest.Mock).mockResolvedValue({ data: { id: "v1", name: "My Shop", rating: 4.5 } });
    const { result} = renderHook(() => useVendorProfile(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual({ id: "v1", name: "My Shop", rating: 4.5 });
  });

  it("should handle fetch error", async () => {
    (vendorApi.getProfile as jest.Mock).mockRejectedValue(new Error("Network Error"));
    const { result} = renderHook(() => useVendorProfile(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.error).toBeDefined();
  });
});

describe("useVendorStats", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch vendor dashboard stats", async () => {
    (vendorApi.getStats as jest.Mock).mockResolvedValue({ data: { totalOrders: 150, revenue: 500000, rating: 4.5 } });
    const { result} = renderHook(() => useVendorStats(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual({ totalOrders: 150, revenue: 500000, rating: 4.5 });
  });
});

describe("useUpdateShop", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should update shop profile", async () => {
    (vendorApi.updateShop as jest.Mock).mockResolvedValue({ data: { id: "v1", name: "Updated Shop" } });
    const { result} = renderHook(() => useUpdateShop(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "Updated Shop" });
    expect(vendorApi.updateShop).toHaveBeenCalledWith({ name: "Updated Shop" });
  });
});
