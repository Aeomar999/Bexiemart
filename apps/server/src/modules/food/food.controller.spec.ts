import { Test, TestingModule } from "@nestjs/testing";
import { FoodController } from "./food.controller";
import { FoodService } from "./food.service";
import { AuthGuard } from "../../guards/auth.guard";

describe("FoodController", () => {
  let controller: FoodController;
  let service: FoodService;

  const mockService = {
    getRestaurants: jest.fn(),
    getRestaurant: jest.fn(),
    getFoodItems: jest.fn(),
    addToCart: jest.fn(),
    getCart: jest.fn(),
    updateCartItem: jest.fn(),
    removeCartItem: jest.fn(),
    clearCart: jest.fn(),
    checkout: jest.fn(),
    getOrders: jest.fn(),
    getOrder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FoodController],
      providers: [
        { provide: FoodService, useValue: mockService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<FoodController>(FoodController);
    service = module.get<FoodService>(FoodService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getRestaurants", () => {
    it("should call service.getRestaurants with parsed pagination", async () => {
      const result = [{ id: "r-1" }];
      mockService.getRestaurants.mockResolvedValue(result);

      expect(await controller.getRestaurants("cat", "1", "20")).toEqual(result);
      expect(mockService.getRestaurants).toHaveBeenCalledWith("cat", 1, 20);
    });
  });

  describe("getRestaurant", () => {
    it("should call service.getRestaurant with id", async () => {
      const result = { id: "r-1" };
      mockService.getRestaurant.mockResolvedValue(result);

      expect(await controller.getRestaurant("id-1")).toEqual(result);
      expect(mockService.getRestaurant).toHaveBeenCalledWith("id-1");
    });
  });

  describe("getFoodItems", () => {
    it("should call service.getFoodItems with parsed pagination", async () => {
      const result = [{ id: "f-1" }];
      mockService.getFoodItems.mockResolvedValue(result);

      expect(await controller.getFoodItems("cat", "search", "1", "20")).toEqual(result);
      expect(mockService.getFoodItems).toHaveBeenCalledWith("cat", "search", 1, 20);
    });
  });

  describe("addToCart", () => {
    it("should call service.addToCart with user id and body fields", async () => {
      const result = { success: true };
      mockService.addToCart.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };
      const body = { foodItemId: "food-1", quantity: 2, specialInstructions: "no onions" };

      expect(await controller.addToCart(req, body)).toEqual(result);
      expect(mockService.addToCart).toHaveBeenCalledWith("user-1", "food-1", 2, "no onions");
    });
  });

  describe("getCart", () => {
    it("should call service.getCart with user id", async () => {
      const result = { items: [] };
      mockService.getCart.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getCart(req)).toEqual(result);
      expect(mockService.getCart).toHaveBeenCalledWith("user-1");
    });
  });

  describe("updateCartItem", () => {
    it("should call service.updateCartItem with user id, param id and body quantity", async () => {
      const result = { success: true };
      mockService.updateCartItem.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.updateCartItem(req, "item-1", { quantity: 3 })).toEqual(result);
      expect(mockService.updateCartItem).toHaveBeenCalledWith("user-1", "item-1", 3);
    });
  });

  describe("removeCartItem", () => {
    it("should call service.removeCartItem with user id and param id", async () => {
      const result = { success: true };
      mockService.removeCartItem.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.removeCartItem(req, "item-1")).toEqual(result);
      expect(mockService.removeCartItem).toHaveBeenCalledWith("user-1", "item-1");
    });
  });

  describe("clearCart", () => {
    it("should call service.clearCart with user id", async () => {
      const result = { success: true };
      mockService.clearCart.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.clearCart(req)).toEqual(result);
      expect(mockService.clearCart).toHaveBeenCalledWith("user-1");
    });
  });

  describe("checkout", () => {
    it("should call service.checkout with user id", async () => {
      const result = { orderId: "ord-1" };
      mockService.checkout.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.checkout(req)).toEqual(result);
      expect(mockService.checkout).toHaveBeenCalledWith("user-1");
    });
  });

  describe("getOrders", () => {
    it("should call service.getOrders with user id and parsed pagination", async () => {
      const result = [{ id: "ord-1" }];
      mockService.getOrders.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getOrders(req, "1", "20")).toEqual(result);
      expect(mockService.getOrders).toHaveBeenCalledWith("user-1", 1, 20);
    });
  });

  describe("getOrder", () => {
    it("should call service.getOrder with user id and param id", async () => {
      const result = { id: "ord-1" };
      mockService.getOrder.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getOrder(req, "order-1")).toEqual(result);
      expect(mockService.getOrder).toHaveBeenCalledWith("user-1", "order-1");
    });
  });
});
