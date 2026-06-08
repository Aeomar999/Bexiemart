import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/vendor-payment-methods", () => ({
  vendorPaymentMethodsApi: {
    getAll: jest.fn(),
    addBank: jest.fn(),
    addMomo: jest.fn(),
    remove: jest.fn(),
    setDefault: jest.fn(),
  },
}));;

import { useVendorPaymentMethods, useAddBankAccount, useAddMomoAccount, useRemovePaymentMethod, useSetDefaultPaymentMethod } from "../use-vendor-payment-methods";
import { vendorPaymentMethodsApi } from "../../api/vendor-payment-methods";
import { createWrapper } from "./test-utils";

describe("useVendorPaymentMethods", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should list payout methods on mount", async () => {
    (vendorPaymentMethodsApi.getAll as jest.Mock).mockResolvedValue({ data: [{ id: "pm1", type: "bank", accountName: "Test" }] });
    const { result} = renderHook(() => useVendorPaymentMethods(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([{ id: "pm1", type: "bank", accountName: "Test" }]);
  });

  it("should handle fetch error", async () => {
    (vendorPaymentMethodsApi.getAll as jest.Mock).mockRejectedValue(new Error("Network Error"));
    const { result} = renderHook(() => useVendorPaymentMethods(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.error).toBeDefined();
  });
});

describe("useAddBankAccount", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should add bank account mutation", async () => {
    (vendorPaymentMethodsApi.addBank as jest.Mock).mockResolvedValue({ data: { id: "pm2", type: "bank" } });
    const { result} = renderHook(() => useAddBankAccount(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ accountName: "Test", accountNumber: "0123456789", bankCode: "001" });
    expect(vendorPaymentMethodsApi.addBank).toHaveBeenCalled();
  });
});

describe("useRemovePaymentMethod", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should remove payment method mutation", async () => {
    (vendorPaymentMethodsApi.remove as jest.Mock).mockResolvedValue({ data: { success: true } });
    const { result} = renderHook(() => useRemovePaymentMethod(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ type: "bank", id: "pm1" });
    expect(vendorPaymentMethodsApi.remove).toHaveBeenCalledWith("bank", "pm1");
  });
});
