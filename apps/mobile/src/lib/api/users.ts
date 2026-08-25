import { apiClient } from "./client";

export const usersApi = {
  getMe: () => apiClient.get("/users/me"),
  updateProfile: (data: {
    name?: string;
    image?: string;
    bio?: string;
    location?: string;
    onboardingCompleted?: boolean;
  }) => apiClient.patch("/users/profile", data),
};
