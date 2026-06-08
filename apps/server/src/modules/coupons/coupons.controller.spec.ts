import { Test, TestingModule } from "@nestjs/testing";
import { CouponsController } from "./coupons.controller";
import { CouponsService } from "./coupons.service";
import { AuthGuard } from "../../guards/auth.guard";

describe("CouponsController", () => {
  let controller: CouponsController;
  let service: CouponsService;

  const mockService = {
    validate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CouponsController],
      providers: [
        { provide: CouponsService, useValue: mockService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<CouponsController>(CouponsController);
    service = module.get<CouponsService>(CouponsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("validate", () => {
    it("should call service.validate with code and orderAmount", async () => {
      const result = { valid: true, discount: 10 };
      mockService.validate.mockResolvedValue(result);

      expect(await controller.validate({ code: "SAVE10", orderAmount: 100 })).toEqual(result);
      expect(mockService.validate).toHaveBeenCalledWith("SAVE10", 100);
    });
  });
});
