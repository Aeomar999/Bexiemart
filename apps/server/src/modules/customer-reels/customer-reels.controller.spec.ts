import { Test, TestingModule } from "@nestjs/testing";
import { CustomerReelsController } from "./customer-reels.controller";
import { CustomerReelsService } from "./customer-reels.service";
import { AuthGuard } from "../../guards/auth.guard";
import { OptionalAuthGuard } from "../../guards/optional-auth.guard";

describe("CustomerReelsController", () => {
  let controller: CustomerReelsController;
  let service: CustomerReelsService;

  const mockService = {
    findAll: jest.fn(),
    toggleLike: jest.fn(),
    incrementView: jest.fn(),
    findFollowing: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerReelsController],
      providers: [{ provide: CustomerReelsService, useValue: mockService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(OptionalAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<CustomerReelsController>(CustomerReelsController);
    service = module.get<CustomerReelsService>(CustomerReelsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should call service.findAll and return result", async () => {
      const result = [{ id: "reel-1", url: "https://example.com/reel.mp4" }];
      mockService.findAll.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.findAll(req)).toEqual(result);
      expect(mockService.findAll).toHaveBeenCalledWith("user-1", undefined);
    });
  });

  describe("toggleLike", () => {
    it("should call service.toggleLike and return result", async () => {
      const result = { liked: true };
      mockService.toggleLike.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.toggleLike(req, "reel-1")).toEqual(result);
      expect(mockService.toggleLike).toHaveBeenCalledWith("user-1", "reel-1");
    });
  });

  describe("incrementView", () => {
    it("should call service.incrementView and return result", async () => {
      const result = { views: 100 };
      mockService.incrementView.mockResolvedValue(result);

      expect(await controller.incrementView("reel-1")).toEqual(result);
      expect(mockService.incrementView).toHaveBeenCalledWith("reel-1");
    });
  });

  describe("findFollowing", () => {
    it("should call service.findFollowing and return result", async () => {
      const result = [{ id: "reel-2" }];
      mockService.findFollowing.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.findFollowing(req)).toEqual(result);
      expect(mockService.findFollowing).toHaveBeenCalledWith("user-1", undefined);
    });
  });
});
