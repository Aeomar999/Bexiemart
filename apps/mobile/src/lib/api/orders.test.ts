jest.mock("./client", () => ({
  apiClient: { post: jest.fn(), get: jest.fn() },
}));

import { ordersApi } from "./orders";
import { apiClient } from "./client";

describe("ordersApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should create order", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: "order-1" } });
    const result = await ordersApi.create({ shippingAddress: { fullName: "Test", phone: "123", street: "Main", city: "NY", state: "NY" } });
    expect(apiClient.post).toHaveBeenCalledWith("/orders", { shippingAddress: { fullName: "Test", phone: "123", street: "Main", city: "NY", state: "NY" } });
    expect(result.data.id).toBe("order-1");
  });

  it("should get all orders", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [{ id: "1" }] } });
    const result = await ordersApi.getAll();
    expect(apiClient.get).toHaveBeenCalledWith("/orders");
    expect(result.data.data).toHaveLength(1);
  });

  it("should get single order", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { id: "order-1" } });
    const result = await ordersApi.getOne("order-1");
    expect(apiClient.get).toHaveBeenCalledWith("/orders/order-1");
    expect(result.data.id).toBe("order-1");
  });

  it("should cancel order", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { status: "cancelled" } });
    const result = await ordersApi.cancel("order-1");
    expect(apiClient.post).toHaveBeenCalledWith("/orders/order-1/cancel");
    expect(result.data.status).toBe("cancelled");
  });
});
