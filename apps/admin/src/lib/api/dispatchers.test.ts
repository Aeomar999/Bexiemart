import { apiClient } from "./client";
import { dispatchersApi } from "./dispatchers";

jest.mock("./client", () => ({
  apiClient: {
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

describe("dispatchers API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getDispatchers", () => {
    it("should list dispatchers", async () => {
      const mockData = { data: [], meta: { total: 0 } };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await dispatchersApi.getDispatchers();

      expect(apiClient.get).toHaveBeenCalledWith("/admin/dispatchers", {
        params: undefined,
      });
      expect(result).toEqual(mockData);
    });

    it("should list dispatchers with params", async () => {
      const mockData = { data: [], meta: { total: 0 } };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      await dispatchersApi.getDispatchers({ page: 2, limit: 10 });

      expect(apiClient.get).toHaveBeenCalledWith("/admin/dispatchers", {
        params: { page: 2, limit: 10 },
      });
    });
  });

  describe("getDispatcher", () => {
    it("should get dispatcher by id", async () => {
      const mockData = { id: "d1", name: "John Rider" };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await dispatchersApi.getDispatcher("d1");

      expect(apiClient.get).toHaveBeenCalledWith("/admin/dispatchers/d1");
      expect(result).toEqual(mockData);
    });
  });

  describe("updateStatus", () => {
    it("should update dispatcher status", async () => {
      const mockData = { id: "d1", status: "ONLINE" };
      (apiClient.patch as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await dispatchersApi.updateStatus("d1", "ONLINE");

      expect(apiClient.patch).toHaveBeenCalledWith("/admin/dispatchers/d1/status", {
        status: "ONLINE",
      });
      expect(result).toEqual(mockData);
    });
  });

  describe("getDeliveries", () => {
    it("should get deliveries with defaults", async () => {
      const mockData = { data: [], meta: { total: 0 } };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await dispatchersApi.getDeliveries();

      expect(apiClient.get).toHaveBeenCalledWith("/admin/deliveries", {
        params: { page: 1, limit: 20, status: undefined },
      });
      expect(result).toEqual(mockData);
    });

    it("should get deliveries with params", async () => {
      const mockData = { data: [], meta: { total: 0 } };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      await dispatchersApi.getDeliveries(2, 10, "active");

      expect(apiClient.get).toHaveBeenCalledWith("/admin/deliveries", {
        params: { page: 2, limit: 10, status: "active" },
      });
    });
  });
});
