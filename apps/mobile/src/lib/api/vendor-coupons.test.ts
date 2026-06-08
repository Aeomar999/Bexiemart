jest.mock("./client", () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn() },
}));

import { vendorCouponsApi } from "./vendor-coupons";
import { apiClient } from "./client";

describe("vendorCouponsApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should get all coupons", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [{ id: "cpn-1" }] } });
    const result = await vendorCouponsApi.getAll();
    expect(apiClient.get).toHaveBeenCalledWith("/vendor/coupons");
    expect(result.data.data).toHaveLength(1);
  });

  it("should create coupon", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: "cpn-1" } });
    const result = await vendorCouponsApi.create({ code: "SAVE10", discount: 10 });
    expect(apiClient.post).toHaveBeenCalledWith("/vendor/coupons", { code: "SAVE10", discount: 10 });
    expect(result.data.id).toBe("cpn-1");
  });

  it("should update coupon", async () => {
    (apiClient.put as jest.Mock).mockResolvedValue({ data: { id: "cpn-1", discount: 20 } });
    const result = await vendorCouponsApi.update("cpn-1", { discount: 20 });
    expect(apiClient.put).toHaveBeenCalledWith("/vendor/coupons/cpn-1", { discount: 20 });
    expect(result.data.discount).toBe(20);
  });

  it("should toggle coupon", async () => {
    (apiClient.patch as jest.Mock).mockResolvedValue({ data: { active: false } });
    const result = await vendorCouponsApi.toggle("cpn-1");
    expect(apiClient.patch).toHaveBeenCalledWith("/vendor/coupons/cpn-1/toggle");
    expect(result.data.active).toBe(false);
  });
});
