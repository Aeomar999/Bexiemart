jest.mock("./client", () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

import { cartApi } from "./cart";
import { apiClient } from "./client";

describe("cartApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should get cart", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { items: [] } });
    const result = await cartApi.getCart();
    expect(apiClient.get).toHaveBeenCalledWith("/cart");
    expect(result.data.items).toEqual([]);
  });

  it("should add item to cart", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: "1" } });
    const result = await cartApi.addItem("prod-1", 2);
    expect(apiClient.post).toHaveBeenCalledWith("/cart", { productId: "prod-1", quantity: 2 });
    expect(result.data.id).toBe("1");
  });

  it("should update cart item", async () => {
    (apiClient.put as jest.Mock).mockResolvedValue({ data: { id: "item-1", quantity: 3 } });
    const result = await cartApi.updateItem("item-1", 3);
    expect(apiClient.put).toHaveBeenCalledWith("/cart/item-1", { quantity: 3 });
    expect(result.data.quantity).toBe(3);
  });

  it("should remove item from cart", async () => {
    (apiClient.delete as jest.Mock).mockResolvedValue({ data: {} });
    await cartApi.removeItem("item-1");
    expect(apiClient.delete).toHaveBeenCalledWith("/cart/item-1");
  });
});
