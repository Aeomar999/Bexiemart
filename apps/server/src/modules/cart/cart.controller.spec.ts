import { Test, TestingModule } from "@nestjs/testing";
import { CartController } from "./cart.controller";
import { CartService } from "./cart.service";
import { AuthGuard } from "../../guards/auth.guard";

describe("CartController", () => {
  let controller: CartController;
  let service: CartService;

  const mockService = {
    getCart: jest.fn(),
    addItem: jest.fn(),
    updateItem: jest.fn(),
    removeItem: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [
        { provide: CartService, useValue: mockService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<CartController>(CartController);
    service = module.get<CartService>(CartService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
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

  describe("addItem", () => {
    it("should call service.addItem with user id and body fields", async () => {
      const result = { success: true };
      mockService.addItem.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };
      const body = { productId: "prod-1", quantity: 2 };

      expect(await controller.addItem(req, body)).toEqual(result);
      expect(mockService.addItem).toHaveBeenCalledWith("user-1", "prod-1", 2);
    });
  });

  describe("updateItem", () => {
    it("should call service.updateItem with user id, param id and body quantity", async () => {
      const result = { success: true };
      mockService.updateItem.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.updateItem(req, "item-1", { quantity: 3 })).toEqual(result);
      expect(mockService.updateItem).toHaveBeenCalledWith("user-1", "item-1", 3);
    });
  });

  describe("removeItem", () => {
    it("should call service.removeItem with user id and param id", async () => {
      const result = { success: true };
      mockService.removeItem.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.removeItem(req, "item-1")).toEqual(result);
      expect(mockService.removeItem).toHaveBeenCalledWith("user-1", "item-1");
    });
  });
});
