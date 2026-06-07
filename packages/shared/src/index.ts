export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role: "CUSTOMER" | "VENDOR" | "DISPATCHER" | "ADMIN";
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "pending" | "success" | "failed" | "refunded";

export type WalletStatus = "active" | "frozen" | "suspended";

export type TransactionType =
  | "topup"
  | "withdrawal"
  | "transfer_sent"
  | "transfer_received"
  | "order_payment"
  | "earnings"
  | "reversal"
  | "fee";

export type TransactionStatus = "pending" | "completed" | "failed" | "reversed";
