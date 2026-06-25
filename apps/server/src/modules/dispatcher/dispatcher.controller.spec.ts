import { Test, TestingModule } from "@nestjs/testing";
import { DispatcherController } from "./dispatcher.controller";
import { DispatcherService } from "./dispatcher.service";
import { AuthGuard } from "../../guards/auth.guard";
import { PrismaService } from "../../prisma/prisma.service";

describe("DispatcherController", () => {
  let controller: DispatcherController;
  let service: DispatcherService;

  const mockService = {
    getProfile: jest.fn(),
    createProfile: jest.fn(),
    updateStatus: jest.fn(),
    updateLocation: jest.fn(),
    getAvailableTasks: jest.fn(),
    getMyTasks: jest.fn(),
    acceptTask: jest.fn(),
    updateTaskStatus: jest.fn(),
    getEarnings: jest.fn(),
    getTransactions: jest.fn(),
    getAnalytics: jest.fn(),
    withdrawEarnings: jest.fn(),
  };

  const mockPrisma = {
    dispatcherProfile: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DispatcherController],
      providers: [
        { provide: DispatcherService, useValue: mockService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<DispatcherController>(DispatcherController);
    service = module.get<DispatcherService>(DispatcherService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getProfile", () => {
    it("should call service.getProfile and return result", async () => {
      const result = { id: "disp-1", status: "online" };
      mockService.getProfile.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getProfile(req)).toEqual(result);
      expect(mockService.getProfile).toHaveBeenCalledWith("user-1");
    });
  });

  describe("createProfile", () => {
    it("should call service.createProfile and return result", async () => {
      const result = { id: "disp-1" };
      mockService.createProfile.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };
      const dto = { vehicle: "car" } as any;

      expect(await controller.createProfile(req, dto)).toEqual(result);
      expect(mockService.createProfile).toHaveBeenCalledWith("user-1", dto);
    });
  });

  describe("toggleStatus", () => {
    it("should call service.updateStatus and return result", async () => {
      const result = { status: "online" };
      mockService.updateStatus.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.toggleStatus(req, { status: "online" } as any)).toEqual(result);
      expect(mockService.updateStatus).toHaveBeenCalledWith("user-1", "online");
    });
  });

  describe("updateLocation", () => {
    it("should call service.updateLocation and return result", async () => {
      const result = { success: true };
      mockService.updateLocation.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.updateLocation(req, { lat: 40.7128, lng: -74.006 })).toEqual(result);
      expect(mockService.updateLocation).toHaveBeenCalledWith("user-1", 40.7128, -74.006);
    });
  });

  describe("getAvailableTasks", () => {
    it("should call service.getAvailableTasks with default pagination", async () => {
      const result = [{ id: "task-1" }];
      mockService.getAvailableTasks.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getAvailableTasks(req)).toEqual(result);
      expect(mockService.getAvailableTasks).toHaveBeenCalledWith("user-1", 1, 20);
    });
  });

  describe("getMyTasks", () => {
    it("should call service.getMyTasks with status and default pagination", async () => {
      const result = [{ id: "task-1", status: "active" }];
      mockService.getMyTasks.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getMyTasks(req, "active")).toEqual(result);
      expect(mockService.getMyTasks).toHaveBeenCalledWith("user-1", "active", 1, 20);
    });
  });

  describe("acceptTask", () => {
    it("should call service.acceptTask and return result", async () => {
      const result = { success: true };
      mockService.acceptTask.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.acceptTask(req, "task-1")).toEqual(result);
      expect(mockService.acceptTask).toHaveBeenCalledWith("user-1", "task-1");
    });
  });

  describe("updateTaskStatus", () => {
    it("should call service.updateTaskStatus and return result", async () => {
      const result = { success: true };
      mockService.updateTaskStatus.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.updateTaskStatus(req, "task-1", { status: "DELIVERED" })).toEqual(
        result
      );
      expect(mockService.updateTaskStatus).toHaveBeenCalledWith("user-1", "task-1", "DELIVERED");
    });
  });

  describe("getEarnings", () => {
    it("should call service.getEarnings and return result", async () => {
      const result = { total: 500 };
      mockService.getEarnings.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getEarnings(req)).toEqual(result);
      expect(mockService.getEarnings).toHaveBeenCalledWith("user-1");
    });
  });

  describe("getTransactions", () => {
    it("should call service.getTransactions and return result", async () => {
      const result = [{ amount: 50 }];
      mockService.getTransactions.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getTransactions(req)).toEqual(result);
      expect(mockService.getTransactions).toHaveBeenCalledWith("user-1");
    });
  });

  describe("getAnalytics", () => {
    it("should call service.getAnalytics and return result", async () => {
      const result = { completedOrders: 10 };
      mockService.getAnalytics.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getAnalytics(req)).toEqual(result);
      expect(mockService.getAnalytics).toHaveBeenCalledWith("user-1");
    });
  });

  describe("withdrawEarnings", () => {
    it("should call service.withdrawEarnings and return result", async () => {
      const result = { success: true };
      mockService.withdrawEarnings.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.withdrawEarnings(req, { amount: 100, destination: "bank" })).toEqual(
        result
      );
      expect(mockService.withdrawEarnings).toHaveBeenCalledWith("user-1", 100, "bank");
    });
  });
});
