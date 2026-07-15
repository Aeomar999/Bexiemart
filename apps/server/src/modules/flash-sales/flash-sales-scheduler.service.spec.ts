import { Test, TestingModule } from "@nestjs/testing";
import { FlashSalesSchedulerService } from "./flash-sales-scheduler.service";
import { PrismaService } from "../../prisma/prisma.service";
import { PostHogService } from "../posthog/posthog.service";
import { mockPrisma } from "../../prisma/prisma.mock";

describe("FlashSalesSchedulerService", () => {
  let service: FlashSalesSchedulerService;
  let prisma: ReturnType<typeof mockPrisma>;
  let mockPostHogService: any;

  beforeEach(async () => {
    prisma = mockPrisma();
    mockPostHogService = {
      isFeatureEnabled: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlashSalesSchedulerService,
        { provide: PrismaService, useValue: prisma },
        { provide: PostHogService, useValue: mockPostHogService },
      ],
    }).compile();

    service = module.get<FlashSalesSchedulerService>(FlashSalesSchedulerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("handleCron", () => {
    it("should skip execution if feature flag flash-sales-scheduler is disabled", async () => {
      mockPostHogService.isFeatureEnabled.mockResolvedValue(false);
      const spy = jest.spyOn(service, "deactivateExpiredFlashSales");

      await service.handleCron();

      expect(mockPostHogService.isFeatureEnabled).toHaveBeenCalledWith(
        "flash-sales-scheduler",
        "server"
      );
      expect(spy).not.toHaveBeenCalled();
    });

    it("should execute deactivateExpiredFlashSales when feature flag is enabled or missing", async () => {
      mockPostHogService.isFeatureEnabled.mockResolvedValue(true);
      const spy = jest.spyOn(service, "deactivateExpiredFlashSales").mockResolvedValue(2);

      await service.handleCron();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe("deactivateExpiredFlashSales", () => {
    it("should return 0 when no flash sales have expired", async () => {
      prisma.flashSale.findMany.mockResolvedValue([]);

      const count = await service.deactivateExpiredFlashSales();

      expect(count).toBe(0);
      expect(prisma.flashSale.findMany).toHaveBeenCalled();
      expect(prisma.flashSale.updateMany).not.toHaveBeenCalled();
    });

    it("should update and deactivate expired flash sales", async () => {
      const mockExpiredSales = [
        { id: "fs-1", title: "Midnight Sale", endDate: new Date("2026-07-13T00:00:00Z") },
        { id: "fs-2", title: "Morning Rush", endDate: new Date("2026-07-13T12:00:00Z") },
      ];
      prisma.flashSale.findMany.mockResolvedValue(mockExpiredSales as any);
      prisma.flashSale.updateMany.mockResolvedValue({ count: 2 });

      const count = await service.deactivateExpiredFlashSales();

      expect(count).toBe(2);
      expect(prisma.flashSale.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["fs-1", "fs-2"] } },
        data: { isActive: false },
      });
    });
  });
});
