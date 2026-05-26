import { apiClient } from "./client";
export const servicesApi = {
  getServices: (params?: { category?: string; search?: string }) =>
    apiClient.get("/services", { params }),
  getService: (id: string) => apiClient.get(`/services/${id}`),
  bookService: (id: string, data: { message?: string; scheduledAt?: string }) =>
    apiClient.post(`/services/${id}/book`, data),
  getBookings: () => apiClient.get("/services/bookings"),
  cancelBooking: (id: string) => apiClient.delete(`/services/bookings/${id}`),
};
