import { Test, TestingModule } from "@nestjs/testing";
import { MetricsController } from "./metrics.controller";
import { MetricsService } from "./metrics.service";

describe("MetricsController", () => {
  let controller: MetricsController;
  let service: MetricsService;

  const mockService = {
    getMetrics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [
        { provide: MetricsService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<MetricsController>(MetricsController);
    service = module.get<MetricsService>(MetricsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getMetrics", () => {
    it("should call service.getMetrics and return result", async () => {
      const result = { cpu: 0.5, memory: 1024 };
      mockService.getMetrics.mockResolvedValue(result);

      expect(await controller.getMetrics()).toEqual(result);
      expect(mockService.getMetrics).toHaveBeenCalled();
    });
  });
});
