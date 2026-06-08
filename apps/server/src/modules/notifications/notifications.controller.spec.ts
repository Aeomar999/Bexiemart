import { Test, TestingModule } from "@nestjs/testing";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { AuthGuard } from "../../guards/auth.guard";

describe("NotificationsController", () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const mockService = {
    findAll: jest.fn(),
    getUnreadCount: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: mockService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should call service.findAll with default pagination", async () => {
      const result = { data: [], total: 0 };
      mockService.findAll.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.findAll(req)).toEqual(result);
      expect(mockService.findAll).toHaveBeenCalledWith("user-1", 1, 20);
    });

    it("should call service.findAll with custom pagination", async () => {
      const result = { data: [], total: 0 };
      mockService.findAll.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.findAll(req, "2", "10")).toEqual(result);
      expect(mockService.findAll).toHaveBeenCalledWith("user-1", 2, 10);
    });
  });

  describe("getUnreadCount", () => {
    it("should call service.getUnreadCount and return result", async () => {
      const result = { count: 5 };
      mockService.getUnreadCount.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.getUnreadCount(req)).toEqual(result);
      expect(mockService.getUnreadCount).toHaveBeenCalledWith("user-1");
    });
  });

  describe("markAsRead", () => {
    it("should call service.markAsRead and return result", async () => {
      const result = { success: true };
      mockService.markAsRead.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.markAsRead(req, "notif-1")).toEqual(result);
      expect(mockService.markAsRead).toHaveBeenCalledWith("user-1", "notif-1");
    });
  });

  describe("markAllAsRead", () => {
    it("should call service.markAllAsRead and return result", async () => {
      const result = { success: true };
      mockService.markAllAsRead.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.markAllAsRead(req)).toEqual(result);
      expect(mockService.markAllAsRead).toHaveBeenCalledWith("user-1");
    });
  });
});
