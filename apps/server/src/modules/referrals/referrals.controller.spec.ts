import { Test, TestingModule } from "@nestjs/testing";
import { ReferralsController } from "./referrals.controller";
import { ReferralsService } from "./referrals.service";
import { AuthGuard } from "../../guards/auth.guard";

describe("ReferralsController", () => {
  let controller: ReferralsController;
  let service: ReferralsService;

  const mockService = {
    generate: jest.fn(),
    getMyReferral: jest.fn(),
    apply: jest.fn(),
    getStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReferralsController],
      providers: [
        { provide: ReferralsService, useValue: mockService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ReferralsController>(ReferralsController);
    service = module.get<ReferralsService>(ReferralsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("generate", () => {
    it("should call service.generate and return result", async () => {
      const result = { code: "REF-ABC" };
      mockService.generate.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.generate(req, {})).toEqual(result);
      expect(mockService.generate).toHaveBeenCalledWith("user-1");
    });
  });

  describe("getMyReferral", () => {
    it("should call service.getMyReferral and return result", async () => {
      const result = { code: "REF-ABC" };
      mockService.getMyReferral.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getMyReferral(req)).toEqual(result);
      expect(mockService.getMyReferral).toHaveBeenCalledWith("user-1");
    });
  });

  describe("apply", () => {
    it("should call service.apply and return result", async () => {
      const result = { success: true };
      mockService.apply.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.apply(req, { code: "ABC" })).toEqual(result);
      expect(mockService.apply).toHaveBeenCalledWith("user-1", "ABC");
    });
  });

  describe("getStats", () => {
    it("should call service.getStats and return result", async () => {
      const result = { total: 10, earnings: 50 };
      mockService.getStats.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getStats(req)).toEqual(result);
      expect(mockService.getStats).toHaveBeenCalledWith("user-1");
    });
  });
});
