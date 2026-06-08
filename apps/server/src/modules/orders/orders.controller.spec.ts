import { Test, TestingModule } from "@nestjs/testing";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { AuthGuard } from "../../guards/auth.guard";

describe("OrdersController", () => {
  let controller: OrdersController;
  let service: OrdersService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    cancel: jest.fn(),
    requestRefund: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: OrdersService, useValue: mockService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<OrdersController>(OrdersController);
    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should call service.create with user id and dto", async () => {
      const result = { id: "ord-1" };
      mockService.create.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };
      const dto = { items: [] } as any;

      expect(await controller.create(req, dto)).toEqual(result);
      expect(mockService.create).toHaveBeenCalledWith("user-1", dto);
    });
  });

  describe("findAll", () => {
    it("should call service.findAll with user id and parsed pagination", async () => {
      const result = [{ id: "ord-1" }];
      mockService.findAll.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.findAll(req, "1", "20")).toEqual(result);
      expect(mockService.findAll).toHaveBeenCalledWith("user-1", 1, 20);
    });
  });

  describe("findOne", () => {
    it("should call service.findOne with user id and param id", async () => {
      const result = { id: "ord-1" };
      mockService.findOne.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.findOne(req, "order-1")).toEqual(result);
      expect(mockService.findOne).toHaveBeenCalledWith("user-1", "order-1");
    });
  });

  describe("cancel", () => {
    it("should call service.cancel with user id and param id", async () => {
      const result = { status: "cancelled" };
      mockService.cancel.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.cancel(req, "order-1")).toEqual(result);
      expect(mockService.cancel).toHaveBeenCalledWith("user-1", "order-1");
    });
  });

  describe("requestRefund", () => {
    it("should call service.requestRefund with user id, param id and reason", async () => {
      const result = { status: "refund_requested" };
      mockService.requestRefund.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.requestRefund(req, "order-1", { reason: "broken" } as any)).toEqual(result);
      expect(mockService.requestRefund).toHaveBeenCalledWith("user-1", "order-1", "broken");
    });
  });
});
