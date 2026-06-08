import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/orders", () => ({
  ordersApi: {
    getAll: jest.fn(),
    getOne: jest.fn(),
    create: jest.fn(),
    cancel: jest.fn(),
  },
}));;

import { useOrders, useOrder, useCreateOrder, useCancelOrder } from "../use-orders";
import { ordersApi } from "../../api/orders";
import { createWrapper } from "./test-utils";

describe("useOrders", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch orders on mount", async () => {
    (ordersApi.getAll as jest.Mock).mockResolvedValue({ data: { data: [{ id: "1", status: "pending" }] } });
    const { result } = renderHook(() => useOrders(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBeFalsy());
  });

  it("should return orders on success", async () => {
    (ordersApi.getAll as jest.Mock).mockResolvedValue({ data: { data: [{ id: "1", status: "pending" }] } });
    const { result} = renderHook(() => useOrders(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([{ id: "1", status: "pending" }]);
  });

  it("should handle empty orders", async () => {
    (ordersApi.getAll as jest.Mock).mockResolvedValue({ data: { data: [] } });
    const { result} = renderHook(() => useOrders(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([]);
  });

  it("should handle fetch error", async () => {
    (ordersApi.getAll as jest.Mock).mockRejectedValue(new Error("Network Error"));
    const { result} = renderHook(() => useOrders(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.error).toBeDefined();
  });
});

describe("useOrder", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch order by id", async () => {
    (ordersApi.getOne as jest.Mock).mockResolvedValue({ data: { id: "1", status: "shipped" } });
    const { result} = renderHook(() => useOrder("1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(ordersApi.getOne).toHaveBeenCalledWith("1");
    expect(result.current.data).toEqual({ id: "1", status: "shipped" });
  });
});

describe("useCreateOrder", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call create mutation with order data", async () => {
    (ordersApi.create as jest.Mock).mockResolvedValue({ data: { id: "1", status: "confirmed" } });
    const { result} = renderHook(() => useCreateOrder(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ items: [{ productId: "p1", quantity: 2 }] });
    expect(ordersApi.create).toHaveBeenCalledWith({ items: [{ productId: "p1", quantity: 2 }] });
  });
});

describe("useCancelOrder", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call cancel mutation with order id", async () => {
    (ordersApi.cancel as jest.Mock).mockResolvedValue({ data: { id: "1", status: "cancelled" } });
    const { result} = renderHook(() => useCancelOrder(), { wrapper: createWrapper() });
    await result.current.mutateAsync("1");
    expect(ordersApi.cancel).toHaveBeenCalledWith("1");
  });
});
