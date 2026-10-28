import { apiClient } from "./client";
import { servicesApi } from "./services";

jest.mock("./client", () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

describe("services API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getServiceVendors", () => {
    it("should list service vendors", async () => {
      const mockData = { data: [], meta: { total: 0 } };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await servicesApi.getServiceVendors();

      expect(apiClient.get).toHaveBeenCalledWith("/admin/service-vendors", {
        params: { page: 1, limit: 20 },
      });
      expect(result).toEqual(mockData);
    });
  });

  describe("getServiceBookings", () => {
    it("should list service bookings", async () => {
      const mockData = { data: [], meta: { total: 0 } };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await servicesApi.getServiceBookings();

      expect(apiClient.get).toHaveBeenCalledWith("/admin/service-bookings", {
        params: { page: 1, limit: 20, status: undefined },
      });
      expect(result).toEqual(mockData);
    });
  });
});
