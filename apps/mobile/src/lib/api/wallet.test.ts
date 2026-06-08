jest.mock("./client", () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

import { walletApi } from "./wallet";
import { apiClient } from "./client";

describe("walletApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should get wallet", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { balance: 100 } });
    const result = await walletApi.getWallet();
    expect(apiClient.get).toHaveBeenCalledWith("/wallet");
    expect(result.data.balance).toBe(100);
  });

  it("should initialize top up", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { reference: "ref-123" } });
    const result = await walletApi.initializeTopUp(5000, "card");
    expect(apiClient.post).toHaveBeenCalledWith("/wallet/topup/initialize", { amount: 5000, channel: "card" });
    expect(result.data.reference).toBe("ref-123");
  });

  it("should add card", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: "card-1" } });
    const result = await walletApi.addCard({ cardNumber: "4111", expiryMonth: "12", expiryYear: "28", cvv: "123" });
    expect(apiClient.post).toHaveBeenCalledWith("/wallet/cards", { cardNumber: "4111", expiryMonth: "12", expiryYear: "28", cvv: "123" });
    expect(result.data.id).toBe("card-1");
  });

  it("should handle error", async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error("Insufficient funds"));
    await expect(walletApi.getWallet()).rejects.toThrow("Insufficient funds");
  });
});
