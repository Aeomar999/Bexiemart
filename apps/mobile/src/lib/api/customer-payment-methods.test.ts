jest.mock("./client", () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), delete: jest.fn(), patch: jest.fn() },
}));

import { customerPaymentMethodsApi } from "./customer-payment-methods";
import { apiClient } from "./client";

describe("customerPaymentMethodsApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should get all payment methods", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [{ id: "pm-1" }] } });
    const result = await customerPaymentMethodsApi.getAll();
    expect(apiClient.get).toHaveBeenCalledWith("/payment-methods");
    expect(result.data.data).toHaveLength(1);
  });

  it("should add card", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: "card-1" } });
    const result = await customerPaymentMethodsApi.addCard({ provider: "visa", details: "4111", holderName: "Test", expiry: "12/28" });
    expect(apiClient.post).toHaveBeenCalledWith("/payment-methods/card", { provider: "visa", details: "4111", holderName: "Test", expiry: "12/28" });
    expect(result.data.id).toBe("card-1");
  });

  it("should add momo", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: "momo-1" } });
    const result = await customerPaymentMethodsApi.addMomo({ provider: "MTN", details: "0551234567", holderName: "Test" });
    expect(apiClient.post).toHaveBeenCalledWith("/payment-methods/momo", { provider: "MTN", details: "0551234567", holderName: "Test" });
    expect(result.data.id).toBe("momo-1");
  });

  it("should remove payment method", async () => {
    (apiClient.delete as jest.Mock).mockResolvedValue({ data: {} });
    await customerPaymentMethodsApi.remove("pm-1");
    expect(apiClient.delete).toHaveBeenCalledWith("/payment-methods/pm-1");
  });
});
