import { Test, TestingModule } from "@nestjs/testing";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

describe("HealthController", () => {
  let controller: HealthController;
  let service: HealthService;

  const mockService = {
    checkDatabase: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthService>(HealthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("check", () => {
    it("should call service.checkDatabase and return health status", async () => {
      const dbResult = { connected: true };
      mockService.checkDatabase.mockResolvedValue(dbResult);

      const result = await controller.check();

      expect(result.status).toEqual("ok");
      expect(result.database).toEqual(dbResult);
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeDefined();
      expect(result.memory).toBeDefined();
      expect(mockService.checkDatabase).toHaveBeenCalled();
    });
  });
});
