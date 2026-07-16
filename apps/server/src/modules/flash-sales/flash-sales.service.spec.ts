import { mockPrisma } from "../../prisma/prisma.mock";
import { FlashSalesService } from "./flash-sales.service";

describe("FlashSalesService", () => {
  let service: FlashSalesService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma();
    service = new FlashSalesService(prisma as any);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should find active flash sales", async () => {
    prisma.flashSale.findMany.mockResolvedValue([]);
    const result = await service.findActive();
    expect(result).toEqual([]);
    expect(prisma.flashSale.findMany).toHaveBeenCalled();
  });

  it("should return empty array and bypass DB query when flash-sales-active feature flag is false", async () => {
    const mockPostHogService = {
      isFeatureEnabled: jest.fn().mockResolvedValue(false),
    };
    const gatedService = new FlashSalesService(prisma as any, mockPostHogService as any);
    const result = await gatedService.findActive();
    expect(result).toEqual([]);
    expect(mockPostHogService.isFeatureEnabled).toHaveBeenCalledWith(
      "flash-sales-active",
      "server"
    );
  });
});
