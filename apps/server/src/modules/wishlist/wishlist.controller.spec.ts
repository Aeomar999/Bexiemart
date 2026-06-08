import { Test, TestingModule } from "@nestjs/testing";
import { WishlistController } from "./wishlist.controller";
import { WishlistService } from "./wishlist.service";
import { AuthGuard } from "../../guards/auth.guard";

describe("WishlistController", () => {
  let controller: WishlistController;
  let service: WishlistService;

  const mockService = {
    getWishlist: jest.fn(),
    toggleWishlist: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WishlistController],
      providers: [
        { provide: WishlistService, useValue: mockService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<WishlistController>(WishlistController);
    service = module.get<WishlistService>(WishlistService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getWishlist", () => {
    it("should call service.getWishlist and return result", async () => {
      const result = [{ productId: "prod-1" }];
      mockService.getWishlist.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getWishlist(req)).toEqual(result);
      expect(mockService.getWishlist).toHaveBeenCalledWith("user-1");
    });
  });

  describe("toggleWishlist", () => {
    it("should call service.toggleWishlist and return result", async () => {
      const result = { added: true };
      mockService.toggleWishlist.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.toggleWishlist(req, "product-1")).toEqual(result);
      expect(mockService.toggleWishlist).toHaveBeenCalledWith("user-1", "product-1");
    });
  });
});
