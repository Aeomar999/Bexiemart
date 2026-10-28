import { apiClient } from "./client";
import {
  getDashboardStats,
  listCoupons,
  createCoupon,
  getAdminUsers,
  getAdminUser,
  updateUserRole,
  getAdmins,
  createAdmin,
  getAdminVendors,
  getAdminVendor,
  approveVendor,
  suspendVendor,
  getAdminOrders,
  getAdminOrder,
  updateOrderStatus,
  getConfig,
  updateConfig,
  getAdminDisputes,
  getAdminDispute,
  resolveDispute,
  getRevenueReport,
  getUsersReport,
  getOrdersReport,
} from "./admin";

jest.mock("./client", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
  },
}));

describe("admin API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getDashboardStats", () => {
    it("should fetch dashboard stats", async () => {
      const mockData = { totalUsers: 100, totalVendors: 15, totalOrders: 500 };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await getDashboardStats();

      expect(apiClient.get).toHaveBeenCalledWith("/admin/dashboard");
      expect(result).toEqual(mockData);
    });
  });

  describe("listCoupons", () => {
    it("should list coupons with params", async () => {
      const mockData = { data: [], meta: { total: 0 } };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await listCoupons({ page: 1, limit: 20 });

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

      const result = await createCoupon({ code: "SAVE20", discountPercent: 20 });

      expect(apiClient.post).toHaveBeenCalledWith("/admin/coupons", {
        code: "SAVE20",
        discountPercent: 20,
      });
      expect(result).toEqual(mockData);
    });
  });

  describe("getAdminUsers", () => {
    it("should get admin users", async () => {
      const mockData = { data: [], meta: { total: 0 } };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await getAdminUsers({ page: 1 });

      expect(apiClient.get).toHaveBeenCalledWith("/admin/users", { params: { page: 1 } });
      expect(result).toEqual(mockData);
    });
  });

  describe("getAdminUser", () => {
    it("should get admin user by id", async () => {
      const mockData = { id: "u1", name: "Alice", email: "alice@test.com" };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await getAdminUser("u1");

      expect(apiClient.get).toHaveBeenCalledWith("/admin/users/u1");
      expect(result).toEqual(mockData);
    });
  });

  describe("updateUserRole", () => {
    it("should update user role", async () => {
      const mockData = { id: "u1", role: "VENDOR" };
      (apiClient.patch as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await updateUserRole("u1", "VENDOR");

      expect(apiClient.patch).toHaveBeenCalledWith("/admin/users/u1/role", {
        role: "VENDOR",
      });
      expect(result).toEqual(mockData);
    });
  });

  describe("getAdmins", () => {
    it("should get admin team members", async () => {
      const mockData = { data: [] };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await getAdmins();

      expect(apiClient.get).toHaveBeenCalledWith("/admin/admins");
      expect(result).toEqual(mockData);
    });
  });

  describe("createAdmin", () => {
    it("should create an admin", async () => {
      const mockData = { id: "a1", email: "admin@test.com" };
      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await createAdmin({
        email: "admin@test.com",
        name: "Admin",
        password: "password123",
      });

      expect(apiClient.post).toHaveBeenCalledWith("/admin/admins", {
        email: "admin@test.com",
        name: "Admin",
        password: "password123",
      });
      expect(result).toEqual(mockData);
    });
  });

  describe("getAdminVendors", () => {
    it("should get admin vendors", async () => {
      const mockData = { data: [], meta: { total: 0 } };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await getAdminVendors();

      expect(apiClient.get).toHaveBeenCalledWith("/admin/vendors", {
        params: undefined,
      });
      expect(result).toEqual(mockData);
    });
  });

  describe("getAdminVendor", () => {
    it("should get admin vendor by id", async () => {
      const mockData = { id: "v1", shopName: "Test Shop" };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await getAdminVendor("v1");

      expect(apiClient.get).toHaveBeenCalledWith("/admin/vendors/v1");
      expect(result).toEqual(mockData);
    });
  });

  describe("approveVendor", () => {
    it("should approve a vendor", async () => {
      const mockData = { id: "v1", isActive: true };
      (apiClient.patch as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await approveVendor("v1");

      expect(apiClient.patch).toHaveBeenCalledWith("/admin/vendors/v1/approve");
      expect(result).toEqual(mockData);
    });
  });

  describe("suspendVendor", () => {
    it("should suspend a vendor", async () => {
      const mockData = { id: "v1", isActive: false };
      (apiClient.patch as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await suspendVendor("v1");

      expect(apiClient.patch).toHaveBeenCalledWith("/admin/vendors/v1/suspend");
      expect(result).toEqual(mockData);
    });
  });

  describe("getAdminOrders", () => {
    it("should get admin orders", async () => {
      const mockData = { data: [], meta: { total: 0 } };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await getAdminOrders({ status: "pending" });

      expect(apiClient.get).toHaveBeenCalledWith("/admin/orders", {
        params: { status: "pending" },
      });
      expect(result).toEqual(mockData);
    });
  });

  describe("getAdminOrder", () => {
    it("should get admin order by id", async () => {
      const mockData = { id: "o1", status: "pending" };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await getAdminOrder("o1");

      expect(apiClient.get).toHaveBeenCalledWith("/admin/orders/o1");
      expect(result).toEqual(mockData);
    });
  });

  describe("updateOrderStatus", () => {
    it("should update order status", async () => {
      const mockData = { id: "o1", status: "confirmed" };
      (apiClient.patch as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await updateOrderStatus("o1", "confirmed");

      expect(apiClient.patch).toHaveBeenCalledWith("/admin/orders/o1/status", {
        status: "confirmed",
      });
      expect(result).toEqual(mockData);
    });
  });

  describe("getConfig", () => {
    it("should get system config", async () => {
      const mockData = { commissionRate: 0.05, minWithdrawal: 10 };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await getConfig();

      expect(apiClient.get).toHaveBeenCalledWith("/admin/config");
      expect(result).toEqual(mockData);
    });
  });

  describe("updateConfig", () => {
    it("should update system config", async () => {
      const mockData = { commissionRate: 0.08 };
      (apiClient.put as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await updateConfig({ commissionRate: 0.08 });

      expect(apiClient.put).toHaveBeenCalledWith("/admin/config", {
        commissionRate: 0.08,
      });
      expect(result).toEqual(mockData);
    });
  });

  describe("getAdminDisputes", () => {
    it("should get admin disputes", async () => {
      const mockData = { data: [], meta: { total: 0 } };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await getAdminDisputes();

      expect(apiClient.get).toHaveBeenCalledWith("/admin/disputes", {
        params: undefined,
      });
      expect(result).toEqual(mockData);
    });
  });

  describe("getAdminDispute", () => {
    it("should get admin dispute by id", async () => {
      const mockData = { id: "d1", status: "open" };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await getAdminDispute("d1");

      expect(apiClient.get).toHaveBeenCalledWith("/admin/disputes/d1");
      expect(result).toEqual(mockData);
    });
  });

  describe("resolveDispute", () => {
    it("should resolve a dispute", async () => {
      const mockData = { id: "d1", status: "resolved" };
      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await resolveDispute("d1", "REFUND", "Item not delivered");

      expect(apiClient.post).toHaveBeenCalledWith("/admin/disputes/d1/resolve", {
        action: "REFUND",
        reason: "Item not delivered",
      });
      expect(result).toEqual(mockData);
    });
  });

  describe("getRevenueReport", () => {
    it("should get revenue report", async () => {
      const mockData = { total: 50000, period: "30d" };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await getRevenueReport({ period: "30d" });

      expect(apiClient.get).toHaveBeenCalledWith("/admin/reports/revenue", {
        params: { period: "30d" },
      });
      expect(result).toEqual(mockData);
    });
  });

  describe("getUsersReport", () => {
    it("should get users report", async () => {
      const mockData = { total: 1000, new: 50 };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await getUsersReport();

      expect(apiClient.get).toHaveBeenCalledWith("/admin/reports/users", {
        params: undefined,
      });
      expect(result).toEqual(mockData);
    });
  });

  describe("getOrdersReport", () => {
    it("should get orders report", async () => {
      const mockData = { total: 500, completed: 400 };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await getOrdersReport();

      expect(apiClient.get).toHaveBeenCalledWith("/admin/reports/orders", {
        params: undefined,
      });
      expect(result).toEqual(mockData);
    });
  });
});
