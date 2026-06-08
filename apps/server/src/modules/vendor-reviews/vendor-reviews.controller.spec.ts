import { Test, TestingModule } from "@nestjs/testing";
import { VendorReviewsController } from "./vendor-reviews.controller";
import { VendorReviewsService } from "./vendor-reviews.service";
import { AuthGuard } from "../../guards/auth.guard";

describe("VendorReviewsController", () => {
  let controller: VendorReviewsController;
  let service: VendorReviewsService;

  const mockService = {
    findAll: jest.fn(),
    reply: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorReviewsController],
      providers: [
        { provide: VendorReviewsService, useValue: mockService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<VendorReviewsController>(VendorReviewsController);
    service = module.get<VendorReviewsService>(VendorReviewsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should call service.findAll and return result", async () => {
      const result = [{ id: "review-1", rating: 5 }];
      mockService.findAll.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.findAll(req)).toEqual(result);
      expect(mockService.findAll).toHaveBeenCalledWith("user-1");
    });
  });

  describe("reply", () => {
    it("should call service.reply and return result", async () => {
      const result = { id: "review-1", reply: "Thank you!" };
      const dto = { reply: "Thank you!" };
      mockService.reply.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.reply(req, "review-1", dto)).toEqual(result);
      expect(mockService.reply).toHaveBeenCalledWith("user-1", "review-1", dto.reply);
    });
  });
});
