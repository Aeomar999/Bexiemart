jest.mock("./client", () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

import { foodApi } from "./food";
import { apiClient } from "./client";

describe("foodApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should get restaurants", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [{ id: "rest-1" }] } });
    const result = await foodApi.getRestaurants({ category: "pizza" });
    expect(apiClient.get).toHaveBeenCalledWith("/food/restaurants", { params: { category: "pizza" } });
    expect(result.data.data).toHaveLength(1);
  });

  it("should add item to cart", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: "item-1" } });
    const result = await foodApi.addToCart({ foodItemId: "fi-1", quantity: 2 });
    expect(apiClient.post).toHaveBeenCalledWith("/food/cart/add", { foodItemId: "fi-1", quantity: 2 });
    expect(result.data.id).toBe("item-1");
  });

  it("should update cart item", async () => {
    (apiClient.put as jest.Mock).mockResolvedValue({ data: { id: "ci-1", quantity: 3 } });
    const result = await foodApi.updateCartItem("ci-1", 3);
    expect(apiClient.put).toHaveBeenCalledWith("/food/cart/item/ci-1", { quantity: 3 });
    expect(result.data.quantity).toBe(3);
  });

  it("should checkout", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { orderId: "order-1" } });
    const result = await foodApi.checkout();
    expect(apiClient.post).toHaveBeenCalledWith("/food/checkout");
    expect(result.data.orderId).toBe("order-1");
  });
});
