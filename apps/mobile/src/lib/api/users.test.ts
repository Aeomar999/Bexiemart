jest.mock("./client", () => ({
  apiClient: { get: jest.fn(), patch: jest.fn() },
}));

import { usersApi } from "./users";
import { apiClient } from "./client";

describe("usersApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should get current user", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { id: "user-1", name: "Test" } });
    const result = await usersApi.getMe();
    expect(apiClient.get).toHaveBeenCalledWith("/users/me");
    expect(result.data.name).toBe("Test");
  });

  it("should update profile", async () => {
    (apiClient.patch as jest.Mock).mockResolvedValue({ data: { name: "Updated" } });
    const result = await usersApi.updateProfile({ name: "Updated" });
    expect(apiClient.patch).toHaveBeenCalledWith("/users/profile", { name: "Updated" });
    expect(result.data.name).toBe("Updated");
  });

  it("should handle error", async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error("Network error"));
    await expect(usersApi.getMe()).rejects.toThrow("Network error");
  });
});
