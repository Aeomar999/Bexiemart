import { apiClient } from "./client";

export interface CreateTicketPayload {
  category: string;
  subject: string;
  orderId?: string;
  content?: string;
  mediaUrl?: string;
}

export interface RateTicketPayload {
  rating: number;
  comment?: string;
}

export const supportApi = {
  createTicket: (data: CreateTicketPayload) => apiClient.post("/support/tickets", data),

  getTickets: (page = 1, limit = 20) =>
    apiClient.get(`/support/tickets?page=${page}&limit=${limit}`),

  getTicket: (ticketId: string) => apiClient.get(`/support/tickets/${ticketId}`),

  rateTicket: (ticketId: string, data: RateTicketPayload) =>
    apiClient.post(`/support/tickets/${ticketId}/rate`, data),
};
