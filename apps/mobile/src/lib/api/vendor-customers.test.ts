jest.mock("./client", () => ({
  apiClient: { get: jest.fn() },
}));

import { vendorCustomersApi } from "./vendor-customers";
import { apiClient } from "./client";

describe("vendorCustomersApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should get all customers", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [{ id: "cust-1" }] } });
    const result = await vendorCustomersApi.getAll();
    expect(apiClient.get).toHaveBeenCalledWith("/vendor/customers");
    expect(result.data.data).toHaveLength(1);
  });

  it("should get single customer", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { id: "cust-1", name: "John" } });
    const result = await vendorCustomersApi.getOne("cust-1");
    expect(apiClient.get).toHaveBeenCalledWith("/vendor/customers/cust-1");
    expect(result.data.name).toBe("John");
  });

  it("should handle error", async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error("Network error"));
    await expect(vendorCustomersApi.getAll()).rejects.toThrow("Network error");
  });
});
