import { Test, TestingModule } from "@nestjs/testing";
import { FlashSalesController } from "./flash-sales.controller";
import { FlashSalesService } from "./flash-sales.service";
import { AuthGuard } from "../../guards/auth.guard";

describe("FlashSalesController", () => {
  let controller: FlashSalesController;
  let service: FlashSalesService;

  const mockService = {
    findActive: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlashSalesController],
      providers: [
        { provide: FlashSalesService, useValue: mockService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<FlashSalesController>(FlashSalesController);
    service = module.get<FlashSalesService>(FlashSalesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findActive", () => {
    it("should call service.findActive and return result", async () => {
      const result = [{ id: "fs-1", discount: 50 }];
      mockService.findActive.mockResolvedValue(result);

      expect(await controller.findActive()).toEqual(result);
      expect(mockService.findActive).toHaveBeenCalled();
    });
  });
});
