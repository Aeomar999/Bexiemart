jest.mock("./client", () => ({
  apiClient: { post: jest.fn(), get: jest.fn() },
}));

import { paymentsApi } from "./payments";
import { apiClient } from "./client";

describe("paymentsApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should initialize payment", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { authorizationUrl: "https://pay.now" } });
    const result = await paymentsApi.initialize({ orderId: "order-1" });
    expect(apiClient.post).toHaveBeenCalledWith("/payments/initialize", { orderId: "order-1" });
    expect(result.data.authorizationUrl).toBe("https://pay.now");
  });

  it("should verify payment", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { status: "success" } });
    const result = await paymentsApi.verify("ref-123");
    expect(apiClient.get).toHaveBeenCalledWith("/payments/verify/ref-123");
    expect(result.data.status).toBe("success");
  });

  it("should handle error", async () => {
    (apiClient.post as jest.Mock).mockRejectedValue(new Error("Payment failed"));
    await expect(paymentsApi.initialize({ orderId: "order-1" })).rejects.toThrow("Payment failed");
  });
});
