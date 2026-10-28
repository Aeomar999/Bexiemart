import { apiClient } from "./client";
import { marketingApi } from "./marketing";

jest.mock("./client", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe("marketing API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getFlashSales", () => {
    it("should list flash sales", async () => {
      const mockData = { data: [], meta: { total: 0 } };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await marketingApi.getFlashSales();

      expect(apiClient.get).toHaveBeenCalledWith("/admin/flash-sales", {
        params: { page: 1, limit: 20 },
      });
      expect(result).toEqual(mockData);
    });
  });

  describe("createFlashSale", () => {
    it("should create a flash sale", async () => {
      const mockData = { id: "fs1", name: "Spring Sale" };
      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await marketingApi.createFlashSale({
        name: "Spring Sale",
        discountPercent: 50,
        startDate: "2024-01-01",
        endDate: "2024-01-07",
      });

      expect(apiClient.post).toHaveBeenCalledWith("/admin/flash-sales", {
        name: "Spring Sale",
        discountPercent: 50,
        startDate: "2024-01-01",
        endDate: "2024-01-07",
      });
      expect(result).toEqual(mockData);
    });
  });

  describe("getCoupons", () => {
    it("should list coupons", async () => {
      const mockData = { data: [], meta: { total: 0 } };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await marketingApi.getCoupons();

      expect(apiClient.get).toHaveBeenCalledWith("/admin/coupons", {
        params: { page: 1, limit: 20 },
      });
      expect(result).toEqual(mockData);
    });
  });

  describe("createCoupon", () => {
    it("should create a coupon", async () => {
      const mockData = { id: "c1", code: "SAVE20" };
      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await marketingApi.createCoupon({
        code: "SAVE20",
        discountPercent: 20,
      });

      expect(apiClient.post).toHaveBeenCalledWith("/admin/coupons", {
        code: "SAVE20",
        discountPercent: 20,
      });
      expect(result).toEqual(mockData);
    });
  });
});
