jest.mock("./client", () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), delete: jest.fn(), patch: jest.fn() },
}));

import { vendorPaymentMethodsApi } from "./vendor-payment-methods";
import { apiClient } from "./client";

describe("vendorPaymentMethodsApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should get all payment methods", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [{ id: "pm-1" }] } });
    const result = await vendorPaymentMethodsApi.getAll();
    expect(apiClient.get).toHaveBeenCalledWith("/vendor/payment-methods");
    expect(result.data.data).toHaveLength(1);
  });

  it("should add bank account", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: "bank-1" } });
    const result = await vendorPaymentMethodsApi.addBank({ accountName: "Test", accountNumber: "123456" });
    expect(apiClient.post).toHaveBeenCalledWith("/vendor/payment-methods/bank", { accountName: "Test", accountNumber: "123456" });
    expect(result.data.id).toBe("bank-1");
  });

  it("should add momo account", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: "momo-1" } });
    const result = await vendorPaymentMethodsApi.addMomo({ provider: "MTN", phoneNumber: "055" });
    expect(apiClient.post).toHaveBeenCalledWith("/vendor/payment-methods/momo", { provider: "MTN", phoneNumber: "055" });
    expect(result.data.id).toBe("momo-1");
  });

  it("should remove payment method", async () => {
    (apiClient.delete as jest.Mock).mockResolvedValue({ data: {} });
    await vendorPaymentMethodsApi.remove("bank", "bank-1");
    expect(apiClient.delete).toHaveBeenCalledWith("/vendor/payment-methods/bank/bank-1");
  });
});
