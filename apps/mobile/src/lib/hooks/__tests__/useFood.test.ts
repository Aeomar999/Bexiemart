import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/food", () => ({
  foodApi: {
    getRestaurants: jest.fn(),
    getRestaurant: jest.fn(),
    getItems: jest.fn(),
    getCart: jest.fn(),
    addToCart: jest.fn(),
    updateCartItem: jest.fn(),
    removeCartItem: jest.fn(),
    clearCart: jest.fn(),
    checkout: jest.fn(),
    getOrders: jest.fn(),
    getOrder: jest.fn(),
  },
}));;

import { useFoodRestaurants, useFoodRestaurant, useFoodItems, useFoodCart, useAddToFoodCart, useUpdateFoodCartItem, useRemoveFoodCartItem, useClearFoodCart, useFoodCheckout, useFoodOrders, useFoodOrder } from "../use-food";
import { foodApi } from "../../api/food";
import { createWrapper } from "./test-utils";

describe("useFoodRestaurants", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch food restaurants on mount", async () => {
    (foodApi.getRestaurants as jest.Mock).mockResolvedValue({ data: { data: [{ id: "r1", name: "Pizza Place" }] } });
    const { result} = renderHook(() => useFoodRestaurants({ category: "pizza" }), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(foodApi.getRestaurants).toHaveBeenCalledWith({ category: "pizza" });
    expect(result.current.data).toEqual([{ id: "r1", name: "Pizza Place" }]);
  });

  it("should handle fetch error", async () => {
    (foodApi.getRestaurants as jest.Mock).mockRejectedValue(new Error("Network Error"));
    const { result} = renderHook(() => useFoodRestaurants(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.error).toBeDefined();
  });
});

describe("useFoodItems", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch food items with search filter", async () => {
    (foodApi.getItems as jest.Mock).mockResolvedValue({ data: { data: [{ id: "i1", name: "Margherita", price: 1500 }] } });
    const { result} = renderHook(() => useFoodItems({ search: "margherita" }), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(foodApi.getItems).toHaveBeenCalledWith({ search: "margherita" });
    expect(result.current.data).toEqual([{ id: "i1", name: "Margherita", price: 1500 }]);
  });
});

describe("useFoodCart / useAddToFoodCart", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch food cart", async () => {
    (foodApi.getCart as jest.Mock).mockResolvedValue({ data: { items: [{ id: "ci1", name: "Margherita", quantity: 2 }] } });
    const { result} = renderHook(() => useFoodCart(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual({ items: [{ id: "ci1", name: "Margherita", quantity: 2 }] });
  });

  it("should add item to cart mutation", async () => {
    (foodApi.addToCart as jest.Mock).mockResolvedValue({ data: { success: true } });
    const { result} = renderHook(() => useAddToFoodCart(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ foodItemId: "i1", quantity: 2, specialInstructions: "Extra cheese" });
    expect(foodApi.addToCart).toHaveBeenCalledWith({ foodItemId: "i1", quantity: 2, specialInstructions: "Extra cheese" });
  });
});

describe("useFoodCheckout / useFoodOrders", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should checkout mutation", async () => {
    (foodApi.checkout as jest.Mock).mockResolvedValue({ data: { orderId: "o1" } });
    const { result} = renderHook(() => useFoodCheckout(), { wrapper: createWrapper() });
    await result.current.mutateAsync();
    expect(foodApi.checkout).toHaveBeenCalled();
  });

  it("should fetch food orders list", async () => {
    (foodApi.getOrders as jest.Mock).mockResolvedValue({ data: { data: [{ id: "o1", status: "pending" }] } });
    const { result} = renderHook(() => useFoodOrders(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([{ id: "o1", status: "pending" }]);
  });
});
