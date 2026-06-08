jest.mock("./client", () => ({
  apiClient: { get: jest.fn(), put: jest.fn() },
}));

import { vendorHoursApi } from "./vendor-hours";
import { apiClient } from "./client";

describe("vendorHoursApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should get all hours", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [{ day: "Monday", open: "09:00" }] } });
    const result = await vendorHoursApi.getAll();
    expect(apiClient.get).toHaveBeenCalledWith("/vendor/hours");
    expect(result.data.data).toHaveLength(1);
  });

  it("should update hours", async () => {
    (apiClient.put as jest.Mock).mockResolvedValue({ data: { success: true } });
    const result = await vendorHoursApi.update([{ day: "Monday", open: "09:00", close: "18:00" }]);
    expect(apiClient.put).toHaveBeenCalledWith("/vendor/hours", [{ day: "Monday", open: "09:00", close: "18:00" }]);
    expect(result.data.success).toBe(true);
  });

  it("should handle error", async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error("Network error"));
    await expect(vendorHoursApi.getAll()).rejects.toThrow("Network error");
  });
});
