import { apiClient } from "./client";
import { foodApi } from "./food";

jest.mock("./client", () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

describe("food API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getFoodVendors", () => {
    it("should list food vendors", async () => {
      const mockData = { data: [], meta: { total: 0 } };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await foodApi.getFoodVendors();

      expect(apiClient.get).toHaveBeenCalledWith("/admin/food-vendors", {
        params: { page: 1, limit: 20 },
      });
      expect(result).toEqual(mockData);
    });

    it("should list food vendors with params", async () => {
      const mockData = { data: [], meta: { total: 0 } };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      await foodApi.getFoodVendors(2, 10);

      expect(apiClient.get).toHaveBeenCalledWith("/admin/food-vendors", {
        params: { page: 2, limit: 10 },
      });
    });
  });

  describe("getFoodOrders", () => {
    it("should list food orders", async () => {
      const mockData = { data: [], meta: { total: 0 } };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await foodApi.getFoodOrders();

      expect(apiClient.get).toHaveBeenCalledWith("/admin/food-orders", {
        params: { page: 1, limit: 20, status: undefined },
      });
      expect(result).toEqual(mockData);
    });
  });
});
