import { apiClient } from "./client";

export const usersApi = {
  getMe: () => apiClient.get("/users/me"),
  updateProfile: (data: { name?: string; image?: string; onboardingCompleted?: boolean }) =>
    apiClient.patch("/users/profile", data),
};
