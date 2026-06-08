jest.mock("./client", () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn() },
}));

import { vendorApi } from "./vendor";
import { apiClient } from "./client";

describe("vendorApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should get vendor profile", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { id: "vendor-1", name: "Shop" } });
    const result = await vendorApi.getProfile();
    expect(apiClient.get).toHaveBeenCalledWith("/vendor/profile");
    expect(result.data.name).toBe("Shop");
  });

  it("should create product", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: "prod-1" } });
    const result = await vendorApi.createProduct({ name: "New Product", price: 10 });
    expect(apiClient.post).toHaveBeenCalledWith("/vendor/products", { name: "New Product", price: 10 });
    expect(result.data.id).toBe("prod-1");
  });

  it("should get vendor orders", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [{ id: "order-1" }] } });
    const result = await vendorApi.getOrders("pending");
    expect(apiClient.get).toHaveBeenCalledWith("/vendor/orders", { params: { status: "pending" } });
    expect(result.data.data).toHaveLength(1);
  });

  it("should handle error", async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error("Network error"));
    await expect(vendorApi.getProfile()).rejects.toThrow("Network error");
  });
});
