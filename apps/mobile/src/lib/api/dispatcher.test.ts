jest.mock("./client", () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}));

import { dispatcherApi } from "./dispatcher";
import { apiClient } from "./client";

describe("dispatcherApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should create profile", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: "disp-1" } });
    const result = await dispatcherApi.createProfile({ vehicleType: "car", licensePlate: "GH-1234", licenseNumber: "LIC-001" });
    expect(apiClient.post).toHaveBeenCalledWith("/dispatcher/profile", { vehicleType: "car", plateNumber: "GH-1234", drivingLicense: "LIC-001" });
    expect(result.data.id).toBe("disp-1");
  });

  it("should get available tasks", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [{ id: "task-1" }] } });
    const result = await dispatcherApi.getAvailableTasks();
    expect(apiClient.get).toHaveBeenCalledWith("/dispatcher/tasks/available");
    expect(result.data.data).toHaveLength(1);
  });

  it("should get my tasks", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [{ id: "task-1", status: "active" }] } });
    const result = await dispatcherApi.getMyTasks("active");
    expect(apiClient.get).toHaveBeenCalledWith("/dispatcher/tasks?status=active");
    expect(result.data.data).toHaveLength(1);
  });

  it("should update dispatcher status", async () => {
    (apiClient.put as jest.Mock).mockResolvedValue({ data: { status: "ONLINE" } });
    const result = await dispatcherApi.updateStatus("ONLINE");
    expect(apiClient.put).toHaveBeenCalledWith("/dispatcher/status", { status: "ONLINE" });
    expect(result.data.status).toBe("ONLINE");
  });
});
