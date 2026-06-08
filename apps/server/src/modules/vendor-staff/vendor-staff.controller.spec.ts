import { Test, TestingModule } from "@nestjs/testing";
import { VendorStaffController } from "./vendor-staff.controller";
import { VendorStaffService } from "./vendor-staff.service";
import { AuthGuard } from "../../guards/auth.guard";

describe("VendorStaffController", () => {
  let controller: VendorStaffController;
  let service: VendorStaffService;

  const mockService = {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    toggle: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorStaffController],
      providers: [
        { provide: VendorStaffService, useValue: mockService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<VendorStaffController>(VendorStaffController);
    service = module.get<VendorStaffService>(VendorStaffService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should call service.findAll and return result", async () => {
      const result = [{ id: "staff-1" }];
      mockService.findAll.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.findAll(req)).toEqual(result);
      expect(mockService.findAll).toHaveBeenCalledWith("user-1");
    });
  });

  describe("create", () => {
    it("should call service.create and return result", async () => {
      const result = { id: "staff-1" };
      const dto = { name: "Jane", email: "jane@shop.com" } as any;
      mockService.create.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.create(req, dto)).toEqual(result);
      expect(mockService.create).toHaveBeenCalledWith("user-1", dto);
    });
  });

  describe("update", () => {
    it("should call service.update and return result", async () => {
      const result = { id: "staff-1", name: "Jane Updated" };
      const dto = { name: "Jane Updated" };
      mockService.update.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.update(req, "staff-1", dto)).toEqual(result);
      expect(mockService.update).toHaveBeenCalledWith("user-1", "staff-1", dto);
    });
  });

  describe("remove", () => {
    it("should call service.remove and return result", async () => {
      const result = { deleted: true };
      mockService.remove.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.remove(req, "staff-1")).toEqual(result);
      expect(mockService.remove).toHaveBeenCalledWith("user-1", "staff-1");
    });
  });

  describe("toggle", () => {
    it("should call service.toggle and return result", async () => {
      const result = { id: "staff-1", active: false };
      mockService.toggle.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.toggle(req, "staff-1")).toEqual(result);
      expect(mockService.toggle).toHaveBeenCalledWith("user-1", "staff-1");
    });
  });
});
