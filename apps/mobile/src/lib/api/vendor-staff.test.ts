jest.mock("./client", () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn() },
}));

import { vendorStaffApi } from "./vendor-staff";
import { apiClient } from "./client";

describe("vendorStaffApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should get all staff", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [{ id: "staff-1" }] } });
    const result = await vendorStaffApi.getAll();
    expect(apiClient.get).toHaveBeenCalledWith("/vendor/staff");
    expect(result.data.data).toHaveLength(1);
  });

  it("should create staff member", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: "staff-1" } });
    const result = await vendorStaffApi.create({ name: "John", role: "assistant" });
    expect(apiClient.post).toHaveBeenCalledWith("/vendor/staff", { name: "John", role: "assistant" });
    expect(result.data.id).toBe("staff-1");
  });

  it("should update staff member", async () => {
    (apiClient.put as jest.Mock).mockResolvedValue({ data: { id: "staff-1", role: "manager" } });
    const result = await vendorStaffApi.update("staff-1", { role: "manager" });
    expect(apiClient.put).toHaveBeenCalledWith("/vendor/staff/staff-1", { role: "manager" });
    expect(result.data.role).toBe("manager");
  });

  it("should toggle staff status", async () => {
    (apiClient.patch as jest.Mock).mockResolvedValue({ data: { active: false } });
    const result = await vendorStaffApi.toggle("staff-1");
    expect(apiClient.patch).toHaveBeenCalledWith("/vendor/staff/staff-1/toggle");
    expect(result.data.active).toBe(false);
  });
});
