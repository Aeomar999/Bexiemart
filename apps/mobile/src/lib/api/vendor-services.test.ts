jest.mock("./client", () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

import { vendorServicesApi } from "./vendor-services";
import { apiClient } from "./client";

describe("vendorServicesApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should get all services", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [{ id: "svc-1" }] } });
    const result = await vendorServicesApi.getAll();
    expect(apiClient.get).toHaveBeenCalledWith("/vendor/services");
    expect(result.data.data).toHaveLength(1);
  });

  it("should get single service", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { id: "svc-1" } });
    const result = await vendorServicesApi.getOne("svc-1");
    expect(apiClient.get).toHaveBeenCalledWith("/vendor/services/svc-1");
    expect(result.data.id).toBe("svc-1");
  });

  it("should create service", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: "svc-1" } });
    const result = await vendorServicesApi.create({ name: "Cleaning", price: 50 });
    expect(apiClient.post).toHaveBeenCalledWith("/vendor/services", { name: "Cleaning", price: 50 });
    expect(result.data.id).toBe("svc-1");
  });

  it("should remove service", async () => {
    (apiClient.delete as jest.Mock).mockResolvedValue({ data: {} });
    await vendorServicesApi.remove("svc-1");
    expect(apiClient.delete).toHaveBeenCalledWith("/vendor/services/svc-1");
  });
});
