import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/payments", () => ({
  paymentsApi: {
    initialize: jest.fn(),
  },
}));;

jest.mock("../../api/customer-payment-methods", () => ({
  customerPaymentMethodsApi: {
    getAll: jest.fn(),
    addCard: jest.fn(),
    addMomo: jest.fn(),
    remove: jest.fn(),
    setDefault: jest.fn(),
  },
}));;

import { useInitializePayment, usePaymentMethods, useAddPaymentMethod, useRemovePaymentMethod, useSetDefaultPaymentMethod } from "../use-payments";
import { paymentsApi } from "../../api/payments";
import { customerPaymentMethodsApi } from "../../api/customer-payment-methods";
import { createWrapper } from "./test-utils";

describe("usePaymentMethods", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should list payment methods on mount", async () => {
    (customerPaymentMethodsApi.getAll as jest.Mock).mockResolvedValue({ data: [{ id: "pm1", type: "card", provider: "visa" }] });
    const { result } = renderHook(() => usePaymentMethods(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBeFalsy());
  });

  it("should return payment methods on success", async () => {
    (customerPaymentMethodsApi.getAll as jest.Mock).mockResolvedValue({ data: [{ id: "pm1", type: "card", provider: "visa" }] });
    const { result} = renderHook(() => usePaymentMethods(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([{ id: "pm1", type: "card", provider: "visa" }]);
  });

  it("should handle empty methods", async () => {
    (customerPaymentMethodsApi.getAll as jest.Mock).mockResolvedValue({ data: [] });
    const { result} = renderHook(() => usePaymentMethods(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([]);
  });

  it("should handle fetch error", async () => {
    (customerPaymentMethodsApi.getAll as jest.Mock).mockRejectedValue(new Error("Network Error"));
    const { result} = renderHook(() => usePaymentMethods(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.error).toBeDefined();
  });
});

describe("useAddPaymentMethod", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call addCard when type is card", async () => {
    (customerPaymentMethodsApi.addCard as jest.Mock).mockResolvedValue({ data: { id: "pm2" } });
    const { result} = renderHook(() => useAddPaymentMethod(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ type: "card", provider: "visa", details: "4111", holderName: "Test User", expiry: "12/28" });
    expect(customerPaymentMethodsApi.addCard).toHaveBeenCalled();
  });

  it("should call addMomo when type is momo", async () => {
    (customerPaymentMethodsApi.addMomo as jest.Mock).mockResolvedValue({ data: { id: "pm3" } });
    const { result} = renderHook(() => useAddPaymentMethod(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ type: "momo", provider: "mtn", details: "08012345678", holderName: "Test User" });
    expect(customerPaymentMethodsApi.addMomo).toHaveBeenCalled();
  });
});

describe("useRemovePaymentMethod", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call remove with payment method id", async () => {
    (customerPaymentMethodsApi.remove as jest.Mock).mockResolvedValue({ data: { success: true } });
    const { result} = renderHook(() => useRemovePaymentMethod(), { wrapper: createWrapper() });
    await result.current.mutateAsync("pm1");
    expect(customerPaymentMethodsApi.remove).toHaveBeenCalledWith("pm1");
  });
});

describe("useInitializePayment", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call initialize with orderId", async () => {
    (paymentsApi.initialize as jest.Mock).mockResolvedValue({ data: { url: "https://pay.com/checkout" } });
    const { result} = renderHook(() => useInitializePayment(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ orderId: "ord1" });
    expect(paymentsApi.initialize).toHaveBeenCalledWith({ orderId: "ord1" });
  });
});
