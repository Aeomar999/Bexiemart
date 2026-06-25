import { Test, TestingModule } from "@nestjs/testing";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { AuthGuard } from "../../guards/auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { SuperAdminGuard } from "../../guards/super-admin.guard";

describe("AdminController", () => {
  let controller: AdminController;
  let service: AdminService;

  const mockService = {
    listUsers: jest.fn(),
    getUser: jest.fn(),
    updateUserRole: jest.fn(),
    listAdmins: jest.fn(),
    createAdmin: jest.fn(),
    listVendors: jest.fn(),
    approveVendor: jest.fn(),
    suspendVendor: jest.fn(),
    getConfig: jest.fn(),
    updateConfig: jest.fn(),
    listOrders: jest.fn(),
    getOrder: jest.fn(),
    updateOrderStatus: jest.fn(),
    listDisputes: jest.fn(),
    resolveDispute: jest.fn(),
    getDashboardStats: jest.fn(),
    getRevenueReport: jest.fn(),
    getUsersReport: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: AdminService, useValue: mockService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(SuperAdminGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AdminController>(AdminController);
    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("listUsers", () => {
    it("should call service.listUsers with default pagination", async () => {
      const result = { data: [], total: 0 };
      mockService.listUsers.mockResolvedValue(result);

      expect(await controller.listUsers()).toEqual(result);
      expect(mockService.listUsers).toHaveBeenCalledWith(1, 20, undefined);
    });

    it("should call service.listUsers with custom pagination", async () => {
      const result = { data: [], total: 0 };
      mockService.listUsers.mockResolvedValue(result);

      expect(await controller.listUsers("2", "50")).toEqual(result);
      expect(mockService.listUsers).toHaveBeenCalledWith(2, 50, undefined);
    });
  });

  describe("getUser", () => {
    it("should call service.getUser with id", async () => {
      const result = { id: "user-1", email: "test@test.com" };
      mockService.getUser.mockResolvedValue(result);

      expect(await controller.getUser("user-1")).toEqual(result);
      expect(mockService.getUser).toHaveBeenCalledWith("user-1");
    });
  });

  describe("updateUserRole", () => {
    it("should call service.updateUserRole with id and role", async () => {
      const result = { id: "user-1", role: "ADMIN" };
      mockService.updateUserRole.mockResolvedValue(result);
      const body = { role: "ADMIN" as any };

      expect(await controller.updateUserRole("user-1", body)).toEqual(result);
      expect(mockService.updateUserRole).toHaveBeenCalledWith("user-1", "ADMIN");
    });
  });

  describe("createAdmin", () => {
    it("should call service.createAdmin with the body", async () => {
      const body = { email: "a@b.com", name: "Admin", password: "supersecret" };
      const result = { id: "u1", role: "ADMIN" };
      mockService.createAdmin.mockResolvedValue(result);

      expect(await controller.createAdmin(body)).toEqual(result);
      expect(mockService.createAdmin).toHaveBeenCalledWith(body);
    });
  });

  describe("listAdmins", () => {
    it("should call service.listAdmins", async () => {
      const result = [{ id: "u1" }];
      mockService.listAdmins.mockResolvedValue(result);

      expect(await controller.listAdmins()).toEqual(result);
      expect(mockService.listAdmins).toHaveBeenCalledWith();
    });
  });

  describe("listVendors", () => {
    it("should call service.listVendors with default pagination", async () => {
      const result = { data: [], total: 0 };
      mockService.listVendors.mockResolvedValue(result);

      expect(await controller.listVendors()).toEqual(result);
      expect(mockService.listVendors).toHaveBeenCalledWith(1, 20, undefined);
    });

    it("should call service.listVendors with custom pagination", async () => {
      const result = { data: [], total: 0 };
      mockService.listVendors.mockResolvedValue(result);

      expect(await controller.listVendors("1", "10")).toEqual(result);
      expect(mockService.listVendors).toHaveBeenCalledWith(1, 10, undefined);
    });
  });

  describe("approveVendor", () => {
    it("should call service.approveVendor with id", async () => {
      mockService.approveVendor.mockResolvedValue({ success: true });

      expect(await controller.approveVendor("vendor-1")).toEqual({ success: true });
      expect(mockService.approveVendor).toHaveBeenCalledWith("vendor-1");
    });
  });

  describe("suspendVendor", () => {
    it("should call service.suspendVendor with id", async () => {
      mockService.suspendVendor.mockResolvedValue({ success: true });

      expect(await controller.suspendVendor("vendor-1")).toEqual({ success: true });
      expect(mockService.suspendVendor).toHaveBeenCalledWith("vendor-1");
    });
  });

  describe("getConfig", () => {
    it("should call service.getConfig", async () => {
      const result = { currency: "USD" };
      mockService.getConfig.mockResolvedValue(result);

      expect(await controller.getConfig()).toEqual(result);
      expect(mockService.getConfig).toHaveBeenCalledWith();
    });
  });

  describe("updateConfig", () => {
    it("should call service.updateConfig with body", async () => {
      const result = { currency: "EUR" };
      mockService.updateConfig.mockResolvedValue(result);
      const body = { commissionRate: 2.5, taxRate: 0.5 };

      expect(await controller.updateConfig(body)).toEqual(result);
      expect(mockService.updateConfig).toHaveBeenCalledWith(body);
    });
  });

  describe("listOrders", () => {
    it("should call service.listOrders with default params", async () => {
      const result = { data: [], total: 0 };
      mockService.listOrders.mockResolvedValue(result);

      expect(await controller.listOrders()).toEqual(result);
      expect(mockService.listOrders).toHaveBeenCalledWith(undefined, 1, 20, undefined);
    });

    it("should call service.listOrders with status filter and pagination", async () => {
      const result = { data: [], total: 0 };
      mockService.listOrders.mockResolvedValue(result);

      expect(await controller.listOrders("PENDING", "1", "10")).toEqual(result);
      expect(mockService.listOrders).toHaveBeenCalledWith("PENDING", 1, 10, undefined);
    });
  });

  describe("getOrder", () => {
    it("should call service.getOrder with id", async () => {
      const result = { id: "order-1" };
      mockService.getOrder.mockResolvedValue(result);

      expect(await controller.getOrder("order-1")).toEqual(result);
      expect(mockService.getOrder).toHaveBeenCalledWith("order-1");
    });
  });

  describe("updateOrderStatus", () => {
    it("should call service.updateOrderStatus with id and status", async () => {
      const result = { id: "order-1" };
      mockService.updateOrderStatus.mockResolvedValue(result);
      const body = { status: "SHIPPED" };

      expect(await controller.updateOrderStatus("order-1", body)).toEqual(result);
      expect(mockService.updateOrderStatus).toHaveBeenCalledWith("order-1", "SHIPPED");
    });
  });

  describe("listDisputes", () => {
    it("should call service.listDisputes with default pagination", async () => {
      const result = { data: [], total: 0 };
      mockService.listDisputes.mockResolvedValue(result);

      expect(await controller.listDisputes()).toEqual(result);
      expect(mockService.listDisputes).toHaveBeenCalledWith(1, 20, undefined);
    });
  });

  describe("resolveDispute", () => {
    it("should call service.resolveDispute with id, action, and reason", async () => {
      const result = { resolved: true };
      mockService.resolveDispute.mockResolvedValue(result);
      const body = { action: "REFUND" as const, reason: "Buyer is correct" };

      expect(await controller.resolveDispute("dispute-1", body)).toEqual(result);
      expect(mockService.resolveDispute).toHaveBeenCalledWith(
        "dispute-1",
        "REFUND",
        "Buyer is correct"
      );
    });
  });

  describe("getDashboardStats", () => {
    it("should call service.getDashboardStats", async () => {
      const result = { totalUsers: 100, totalOrders: 500 };
      mockService.getDashboardStats.mockResolvedValue(result);

      expect(await controller.getDashboardStats()).toEqual(result);
      expect(mockService.getDashboardStats).toHaveBeenCalledWith();
    });
  });

  describe("getRevenueReport", () => {
    it("should call service.getRevenueReport with date range", async () => {
      const result = { total: 10000 };
      mockService.getRevenueReport.mockResolvedValue(result);

      expect(await controller.getRevenueReport("2024-01-01", "2024-12-31")).toEqual(result);
      expect(mockService.getRevenueReport).toHaveBeenCalledWith("2024-01-01", "2024-12-31");
    });
  });

  describe("getUsersReport", () => {
    it("should call service.getUsersReport with date range", async () => {
      const result = { total: 50 };
      mockService.getUsersReport.mockResolvedValue(result);

      expect(await controller.getUsersReport("2024-01-01", "2024-12-31")).toEqual(result);
      expect(mockService.getUsersReport).toHaveBeenCalledWith("2024-01-01", "2024-12-31");
    });
  });
});
