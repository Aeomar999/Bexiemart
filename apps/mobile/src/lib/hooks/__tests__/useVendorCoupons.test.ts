import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/vendor-coupons", () => ({
  vendorCouponsApi: {
    getAll: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
    toggle: jest.fn(),
  },
}));;

import { useVendorCoupons, useCreateCoupon, useDeleteCoupon } from "../use-vendor-coupons";
import { vendorCouponsApi } from "../../api/vendor-coupons";
import { createWrapper } from "./test-utils";

describe("useVendorCoupons", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should list vendor coupons on mount", async () => {
    (vendorCouponsApi.getAll as jest.Mock).mockResolvedValue({ data: [{ id: "c1", code: "WELCOME10", discount: 10 }] });
    const { result} = renderHook(() => useVendorCoupons(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([{ id: "c1", code: "WELCOME10", discount: 10 }]);
  });

  it("should handle fetch error", async () => {
    (vendorCouponsApi.getAll as jest.Mock).mockRejectedValue(new Error("Network Error"));
    const { result} = renderHook(() => useVendorCoupons(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.error).toBeDefined();
  });
});

describe("useCreateCoupon", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should create coupon mutation", async () => {
    (vendorCouponsApi.create as jest.Mock).mockResolvedValue({ data: { id: "c2", code: "SALE20" } });
    const { result} = renderHook(() => useCreateCoupon(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ code: "SALE20", discount: 20, type: "percentage" });
    expect(vendorCouponsApi.create).toHaveBeenCalledWith({ code: "SALE20", discount: 20, type: "percentage" });
  });
});

describe("useDeleteCoupon", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should delete coupon mutation", async () => {
    (vendorCouponsApi.remove as jest.Mock).mockResolvedValue({ data: { success: true } });
    const { result} = renderHook(() => useDeleteCoupon(), { wrapper: createWrapper() });
    await result.current.mutateAsync("c1");
    expect(vendorCouponsApi.remove).toHaveBeenCalledWith("c1");
  });
});
