jest.mock("./client", () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn() },
}));

import { addressesApi } from "./addresses";
import { apiClient } from "./client";

describe("addressesApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should get all addresses", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [{ id: "addr-1" }] } });
    const result = await addressesApi.getAll();
    expect(apiClient.get).toHaveBeenCalledWith("/addresses");
    expect(result.data.data).toHaveLength(1);
  });

  it("should create address", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: "addr-1" } });
    const result = await addressesApi.create({ type: "home", name: "Home", address: "123 St", city: "NY", phone: "123" });
    expect(apiClient.post).toHaveBeenCalledWith("/addresses", { type: "home", name: "Home", address: "123 St", city: "NY", phone: "123" });
    expect(result.data.id).toBe("addr-1");
  });

  it("should update address", async () => {
    (apiClient.put as jest.Mock).mockResolvedValue({ data: { id: "addr-1", name: "Updated" } });
    const result = await addressesApi.update("addr-1", { name: "Updated" });
    expect(apiClient.put).toHaveBeenCalledWith("/addresses/addr-1", { name: "Updated" });
    expect(result.data.name).toBe("Updated");
  });

  it("should remove address", async () => {
    (apiClient.delete as jest.Mock).mockResolvedValue({ data: {} });
    await addressesApi.remove("addr-1");
    expect(apiClient.delete).toHaveBeenCalledWith("/addresses/addr-1");
  });
});
