import { apiClient } from "./client";

export interface CreateDispatcherProfileDto {
  vehicleType: string;
  licensePlate: string;
  licenseNumber: string;
}

export const dispatcherApi = {
  createProfile: (data: CreateDispatcherProfileDto) =>
    apiClient.post("/dispatcher/profile", {
      vehicleType: data.vehicleType,
      plateNumber: data.licensePlate,
      drivingLicense: data.licenseNumber,
    }),
  getAvailableTasks: () => apiClient.get("/dispatcher/tasks/available"),

  getMyTasks: (status: "active" | "completed") =>
    apiClient.get(`/dispatcher/tasks?status=${status}`),

  acceptTask: (taskId: string) => apiClient.post(`/dispatcher/tasks/${taskId}/accept`, {}),

  updateTaskStatus: (taskId: string, status: string) =>
    apiClient.put(`/dispatcher/tasks/${taskId}/status`, { status }),

  updateLocation: (lat: number, lng: number) => apiClient.put("/dispatcher/location", { lat, lng }),

  updateStatus: (status: "ONLINE" | "OFFLINE") => apiClient.put("/dispatcher/status", { status }),

  getEarnings: () => apiClient.get("/dispatcher/earnings"),

  getTransactions: () => apiClient.get("/dispatcher/earnings/transactions"),

  getAnalytics: () => apiClient.get("/dispatcher/earnings/analytics"),

  withdrawEarnings: (amount: number, destination: string) =>
    apiClient.post("/dispatcher/earnings/withdraw", { amount, destination }),
};
