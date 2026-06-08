import { Test, TestingModule } from "@nestjs/testing";
import { ReviewsController } from "./reviews.controller";
import { ReviewsService } from "./reviews.service";
import { AuthGuard } from "../../guards/auth.guard";

describe("ReviewsController", () => {
  let controller: ReviewsController;
  let service: ReviewsService;

  const mockService = {
    create: jest.fn(),
    findByProduct: jest.fn(),
    getProductStats: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [
        { provide: ReviewsService, useValue: mockService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ReviewsController>(ReviewsController);
    service = module.get<ReviewsService>(ReviewsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should call service.create with user id and dto", async () => {
      const result = { id: "rev-1" };
      mockService.create.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };
      const dto = { productId: "prod-1", rating: 5, comment: "Great!" };

      expect(await controller.create(req, dto)).toEqual(result);
      expect(mockService.create).toHaveBeenCalledWith("user-1", dto);
    });
  });

  describe("findByProduct", () => {
    it("should call service.findByProduct with product id", async () => {
      const result = [{ id: "rev-1" }];
      mockService.findByProduct.mockResolvedValue(result);

      expect(await controller.findByProduct("prod-1")).toEqual(result);
      expect(mockService.findByProduct).toHaveBeenCalledWith("prod-1");
    });
  });

  describe("getProductStats", () => {
    it("should call service.getProductStats with product id", async () => {
      const result = { average: 4.5, count: 10 };
      mockService.getProductStats.mockResolvedValue(result);

      expect(await controller.getProductStats("prod-1")).toEqual(result);
      expect(mockService.getProductStats).toHaveBeenCalledWith("prod-1");
    });
  });

  describe("remove", () => {
    it("should call service.remove with user id and param id", async () => {
      const result = { deleted: true };
      mockService.remove.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.remove(req, "rev-1")).toEqual(result);
      expect(mockService.remove).toHaveBeenCalledWith("user-1", "rev-1");
    });
  });
});
