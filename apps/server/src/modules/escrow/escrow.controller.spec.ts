import { Test, TestingModule } from "@nestjs/testing";
import { EscrowController } from "./escrow.controller";
import { EscrowService } from "./escrow.service";
import { AuthGuard } from "../../guards/auth.guard";

describe("EscrowController", () => {
  let controller: EscrowController;
  let service: EscrowService;

  const mockService = {
    list: jest.fn(),
    get: jest.fn(),
    dispute: jest.fn(),
    release: jest.fn(),
    refund: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EscrowController],
      providers: [
        { provide: EscrowService, useValue: mockService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<EscrowController>(EscrowController);
    service = module.get<EscrowService>(EscrowService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("list", () => {
    it("should call service.list with user id", async () => {
      const result = [{ id: "esc-1" }];
      mockService.list.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.list(req)).toEqual(result);
      expect(mockService.list).toHaveBeenCalledWith("user-1");
    });
  });

  describe("get", () => {
    it("should call service.get with user id and param id", async () => {
      const result = { id: "esc-1" };
      mockService.get.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.get(req, "esc-1")).toEqual(result);
      expect(mockService.get).toHaveBeenCalledWith("user-1", "esc-1");
    });
  });

  describe("dispute", () => {
    it("should call service.dispute with user id, param id and reason", async () => {
      const result = { status: "disputed" };
      mockService.dispute.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.dispute(req, "esc-1", { reason: "item not received" })).toEqual(result);
      expect(mockService.dispute).toHaveBeenCalledWith("user-1", "esc-1", "item not received");
    });
  });

  describe("release", () => {
    it("should call service.release with user id and param id", async () => {
      const result = { status: "released" };
      mockService.release.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.release(req, "esc-1")).toEqual(result);
      expect(mockService.release).toHaveBeenCalledWith("user-1", "esc-1");
    });
  });

  describe("refund", () => {
    it("should call service.refund with user id and param id", async () => {
      const result = { status: "refunded" };
      mockService.refund.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.refund(req, "esc-1")).toEqual(result);
      expect(mockService.refund).toHaveBeenCalledWith("user-1", "esc-1");
    });
  });
});
