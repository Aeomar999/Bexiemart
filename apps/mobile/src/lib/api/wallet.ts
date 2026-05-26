import { apiClient } from "./client";

export const walletApi = {
  getWallet: () => apiClient.get("/wallet"),
  getTransactions: (page = 1) => apiClient.get(`/wallet/transactions?page=${page}`),
  initializeTopUp: (amount: number, channel: string) => apiClient.post("/wallet/topup/initialize", { amount, channel }),
  verifyTopUp: (reference: string) => apiClient.get(`/wallet/topup/verify/${reference}`),
  transfer: (recipientEmail: string, amount: number, pin: string) => apiClient.post("/wallet/transfer", { recipientEmail, amount, pin }),
  setPin: (pin: string) => apiClient.post("/wallet/pin", { pin }),
  changePin: (currentPin: string, newPin: string) => apiClient.post("/wallet/pin/change", { currentPin, newPin }),
  verifyPin: (pin: string) => apiClient.post("/wallet/pin/verify", { pin }),
  resetPinFailures: () => apiClient.post("/wallet/pin/reset"),
  getPinStatus: () => apiClient.get("/wallet/pin/status"),
};
