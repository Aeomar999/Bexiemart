import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/cart", () => ({
  cartApi: {
    getCart: jest.fn(),
    addItem: jest.fn(),
    updateItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));;

import { useCart, useAddToCart, useUpdateCartItem, useRemoveFromCart } from "../use-cart";
import { cartApi } from "../../api/cart";
import { createWrapper } from "./test-utils";

describe("useCart", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch cart on mount", async () => {
    (cartApi.getCart as jest.Mock).mockResolvedValue({ data: { items: [{ id: "1", productId: "p1", quantity: 2 }] } });
    const { result } = renderHook(() => useCart(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBeFalsy());
  });

  it("should return cart data on success", async () => {
    (cartApi.getCart as jest.Mock).mockResolvedValue({ data: { items: [{ id: "1", productId: "p1", quantity: 2 }] } });
    const { result} = renderHook(() => useCart(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual({ items: [{ id: "1", productId: "p1", quantity: 2 }] });
  });

  it("should handle fetch error", async () => {
    (cartApi.getCart as jest.Mock).mockRejectedValue(new Error("Network Error"));
    const { result} = renderHook(() => useCart(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.error).toBeDefined();
  });

  it("should handle empty cart", async () => {
    (cartApi.getCart as jest.Mock).mockResolvedValue({ data: { items: [] } });
    const { result} = renderHook(() => useCart(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data.items).toEqual([]);
  });
});

describe("useAddToCart", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call addItem mutation with productId and quantity", async () => {
    (cartApi.addItem as jest.Mock).mockResolvedValue({ data: { success: true } });
    const { result} = renderHook(() => useAddToCart(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ productId: "p1", quantity: 1 });
    expect(cartApi.addItem).toHaveBeenCalledWith("p1", 1);
  });

  it("should handle add to cart error", async () => {
    (cartApi.addItem as jest.Mock).mockRejectedValue(new Error("Out of stock"));
    const { result} = renderHook(() => useAddToCart(), { wrapper: createWrapper() });
    result.current.mutate({ productId: "p1", quantity: 1 });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useUpdateCartItem", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call updateItem mutation with itemId and quantity", async () => {
    (cartApi.updateItem as jest.Mock).mockResolvedValue({ data: { success: true } });
    const { result} = renderHook(() => useUpdateCartItem(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ itemId: "item1", productId: "p1", quantity: 3 });
    expect(cartApi.updateItem).toHaveBeenCalledWith("item1", 3);
  });
});

describe("useRemoveFromCart", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call removeItem mutation with itemId", async () => {
    (cartApi.removeItem as jest.Mock).mockResolvedValue({ data: { success: true } });
    const { result} = renderHook(() => useRemoveFromCart(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ itemId: "item1", productId: "p1" });
    expect(cartApi.removeItem).toHaveBeenCalledWith("item1");
  });
});
