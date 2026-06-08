jest.mock("./client", () => ({
  apiClient: { post: jest.fn() },
}));

import { couponsApi } from "./coupons";
import { apiClient } from "./client";

describe("couponsApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should validate coupon", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { valid: true, discount: 10 } });
    const result = await couponsApi.validate({ code: "SAVE10", orderAmount: 100 });
    expect(apiClient.post).toHaveBeenCalledWith("/coupons/validate", { code: "SAVE10", orderAmount: 100 });
    expect(result.data.valid).toBe(true);
  });

  it("should handle error", async () => {
    (apiClient.post as jest.Mock).mockRejectedValue(new Error("Invalid coupon"));
    await expect(couponsApi.validate({ code: "BAD", orderAmount: 50 })).rejects.toThrow("Invalid coupon");
  });
});
