import { Test, TestingModule } from "@nestjs/testing";
import { VendorHoursController } from "./vendor-hours.controller";
import { VendorHoursService } from "./vendor-hours.service";
import { AuthGuard } from "../../guards/auth.guard";

describe("VendorHoursController", () => {
  let controller: VendorHoursController;
  let service: VendorHoursService;

  const mockService = {
    findAll: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorHoursController],
      providers: [
        { provide: VendorHoursService, useValue: mockService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<VendorHoursController>(VendorHoursController);
    service = module.get<VendorHoursService>(VendorHoursService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should call service.findAll and return result", async () => {
      const result = [{ day: "Monday", open: "09:00", close: "17:00" }];
      mockService.findAll.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.findAll(req)).toEqual(result);
      expect(mockService.findAll).toHaveBeenCalledWith("user-1");
    });
  });

  describe("update", () => {
    it("should call service.update with hours and return result", async () => {
      const result = [{ day: "Monday", open: "09:00", close: "17:00" }];
      const hours = [{ day: "Monday", open: "09:00", close: "17:00" }] as any;
      const body = { hours } as any;
      mockService.update.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.update(req, body)).toEqual(result);
      expect(mockService.update).toHaveBeenCalledWith("user-1", hours);
    });
  });
});
