jest.mock("./client", () => ({
  apiClient: { get: jest.fn(), patch: jest.fn(), put: jest.fn() },
}));

import { adminApi } from "./admin";
import { apiClient } from "./client";

describe("adminApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should get users", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [{ id: "user-1" }] } });
    const result = await adminApi.getUsers(1, 20);
    expect(apiClient.get).toHaveBeenCalledWith("/admin/users?page=1&limit=20");
    expect(result.data.data).toHaveLength(1);
  });

  it("should update user role", async () => {
    (apiClient.patch as jest.Mock).mockResolvedValue({ data: { id: "user-1", role: "ADMIN" } });
    const result = await adminApi.updateUserRole("user-1", "ADMIN");
    expect(apiClient.patch).toHaveBeenCalledWith("/admin/users/user-1/role", { role: "ADMIN" });
    expect(result.data.role).toBe("ADMIN");
  });

  it("should approve vendor", async () => {
    (apiClient.patch as jest.Mock).mockResolvedValue({ data: { id: "vendor-1", approved: true } });
    const result = await adminApi.approveVendor("vendor-1");
    expect(apiClient.patch).toHaveBeenCalledWith("/admin/vendors/vendor-1/approve");
    expect(result.data.approved).toBe(true);
  });

  it("should update config", async () => {
    (apiClient.put as jest.Mock).mockResolvedValue({ data: { maintenance: false } });
    const result = await adminApi.updateConfig({ maintenance: false });
    expect(apiClient.put).toHaveBeenCalledWith("/admin/config", { maintenance: false });
    expect(result.data.maintenance).toBe(false);
  });
});
