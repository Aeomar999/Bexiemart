import { Test, TestingModule } from "@nestjs/testing";
import { VendorController } from "./vendor.controller";
import { VendorService } from "./vendor.service";
import { AuthGuard } from "../../guards/auth.guard";
import { VendorGuard } from "../../guards/vendor.guard";

describe("VendorController", () => {
  let controller: VendorController;
  let service: VendorService;

  const mockService = {
    getProfile: jest.fn(),
    onboard: jest.fn(),
    getStats: jest.fn(),
    getProducts: jest.fn(),
    createProduct: jest.fn(),
    updateProduct: jest.fn(),
    deleteProduct: jest.fn(),
    getOrders: jest.fn(),
    getOrder: jest.fn(),
    updateOrderStatus: jest.fn(),
    getEarnings: jest.fn(),
    getTransactions: jest.fn(),
    getAnalytics: jest.fn(),
    withdrawEarnings: jest.fn(),
    updateShop: jest.fn(),
    getDisputes: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorController],
      providers: [
        { provide: VendorService, useValue: mockService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(VendorGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<VendorController>(VendorController);
    service = module.get<VendorService>(VendorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getProfile", () => {
    it("should call service.getProfile with user id", async () => {
      const result = { id: "vendor-1", businessName: "Test Shop" };
      mockService.getProfile.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getProfile(req)).toEqual(result);
      expect(mockService.getProfile).toHaveBeenCalledWith("user-1");
    });
  });

  describe("onboard", () => {
    it("should call service.onboard with user id and body", async () => {
      const result = { id: "vendor-1" };
      mockService.onboard.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };
      const body = { shopName: "Test Shop", slug: "test-shop", description: "A test shop" };

      expect(await controller.onboard(req, body)).toEqual(result);
      expect(mockService.onboard).toHaveBeenCalledWith("user-1", body);
    });
  });

  describe("getStats", () => {
    it("should call service.getStats with user id", async () => {
      const result = { totalProducts: 10, totalOrders: 25 };
      mockService.getStats.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getStats(req)).toEqual(result);
      expect(mockService.getStats).toHaveBeenCalledWith("user-1");
    });
  });

  describe("getProducts", () => {
    it("should call service.getProducts with default pagination", async () => {
      const result = { data: [], total: 0 };
      mockService.getProducts.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getProducts(req)).toEqual(result);
      expect(mockService.getProducts).toHaveBeenCalledWith("user-1", 1, 20);
    });

    it("should call service.getProducts with custom pagination", async () => {
      const result = { data: [], total: 0 };
      mockService.getProducts.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getProducts(req, "2", "10")).toEqual(result);
      expect(mockService.getProducts).toHaveBeenCalledWith("user-1", 2, 10);
    });
  });

  describe("createProduct", () => {
    it("should call service.createProduct with user id and body", async () => {
      const result = { id: "prod-1" };
      mockService.createProduct.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };
      const body = { name: "Test Product", description: "A test product", price: 100 };

      expect(await controller.createProduct(req, body)).toEqual(result);
      expect(mockService.createProduct).toHaveBeenCalledWith("user-1", body);
    });
  });

  describe("updateProduct", () => {
    it("should call service.updateProduct with user id, product id, and body", async () => {
      const result = { id: "prod-1" };
      mockService.updateProduct.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };
      const body = { name: "Updated Product" };

      expect(await controller.updateProduct(req, "prod-1", body)).toEqual(result);
      expect(mockService.updateProduct).toHaveBeenCalledWith("user-1", "prod-1", body);
    });
  });

  describe("deleteProduct", () => {
    it("should call service.deleteProduct with user id and product id", async () => {
      mockService.deleteProduct.mockResolvedValue({ success: true });
      const req = { user: { id: "user-1" } };

      expect(await controller.deleteProduct(req, "prod-1")).toEqual({ success: true });
      expect(mockService.deleteProduct).toHaveBeenCalledWith("user-1", "prod-1");
    });
  });

  describe("getOrders", () => {
    it("should call service.getOrders with default pagination", async () => {
      const result = { data: [], total: 0 };
      mockService.getOrders.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getOrders(req)).toEqual(result);
      expect(mockService.getOrders).toHaveBeenCalledWith("user-1", 1, 20);
    });

    it("should call service.getOrders with custom pagination", async () => {
      const result = { data: [], total: 0 };
      mockService.getOrders.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getOrders(req, "1", "50")).toEqual(result);
      expect(mockService.getOrders).toHaveBeenCalledWith("user-1", 1, 50);
    });
  });

  describe("getOrder", () => {
    it("should call service.getOrder with user id and order id", async () => {
      const result = { id: "order-1" };
      mockService.getOrder.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getOrder(req, "order-1")).toEqual(result);
      expect(mockService.getOrder).toHaveBeenCalledWith("user-1", "order-1");
    });
  });

  describe("updateOrderStatus", () => {
    it("should call service.updateOrderStatus with user id, order id, and status", async () => {
      const result = { id: "order-1" };
      mockService.updateOrderStatus.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };
      const body = { status: "SHIPPED" };

      expect(await controller.updateOrderStatus(req, "order-1", body)).toEqual(result);
      expect(mockService.updateOrderStatus).toHaveBeenCalledWith("user-1", "order-1", "SHIPPED");
    });
  });

  describe("getEarnings", () => {
    it("should call service.getEarnings with user id", async () => {
      const result = { total: 5000, available: 3000 };
      mockService.getEarnings.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getEarnings(req)).toEqual(result);
      expect(mockService.getEarnings).toHaveBeenCalledWith("user-1");
    });
  });

  describe("getTransactions", () => {
    it("should call service.getTransactions with user id", async () => {
      const result = { data: [] };
      mockService.getTransactions.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getTransactions(req)).toEqual(result);
      expect(mockService.getTransactions).toHaveBeenCalledWith("user-1");
    });
  });

  describe("getAnalytics", () => {
    it("should call service.getAnalytics with user id", async () => {
      const result = { views: 100, sales: 20 };
      mockService.getAnalytics.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getAnalytics(req)).toEqual(result);
      expect(mockService.getAnalytics).toHaveBeenCalledWith("user-1");
    });
  });

  describe("withdraw", () => {
    it("should call service.withdrawEarnings with user id, amount, and destination", async () => {
      const result = { success: true };
      mockService.withdrawEarnings.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };
      const body = { amount: 5000, destination: "bank-account-id" };

      expect(await controller.withdraw(req, body)).toEqual(result);
      expect(mockService.withdrawEarnings).toHaveBeenCalledWith("user-1", 5000, "bank-account-id");
    });
  });

  describe("updateShop", () => {
    it("should call service.updateShop with user id and body", async () => {
      const result = { id: "shop-1" };
      mockService.updateShop.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };
      const body = { shopName: "New Shop Name", description: "Updated description" };

      expect(await controller.updateShop(req, body)).toEqual(result);
      expect(mockService.updateShop).toHaveBeenCalledWith("user-1", body);
    });
  });

  describe("getDisputes", () => {
    it("should call service.getDisputes with default pagination", async () => {
      const result = { data: [], total: 0 };
      mockService.getDisputes.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getDisputes(req)).toEqual(result);
      expect(mockService.getDisputes).toHaveBeenCalledWith("user-1", 1, 20);
    });

    it("should call service.getDisputes with custom pagination", async () => {
      const result = { data: [], total: 0 };
      mockService.getDisputes.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getDisputes(req, "1", "5")).toEqual(result);
      expect(mockService.getDisputes).toHaveBeenCalledWith("user-1", 1, 5);
    });
  });
});
