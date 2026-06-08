import { Test, TestingModule } from "@nestjs/testing";
import { VendorPaymentMethodsController } from "./vendor-payment-methods.controller";
import { VendorPaymentMethodsService } from "./vendor-payment-methods.service";
import { AuthGuard } from "../../guards/auth.guard";

describe("VendorPaymentMethodsController", () => {
  let controller: VendorPaymentMethodsController;
  let service: VendorPaymentMethodsService;

  const mockService = {
    findAll: jest.fn(),
    addBank: jest.fn(),
    addMomo: jest.fn(),
    remove: jest.fn(),
    setDefault: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorPaymentMethodsController],
      providers: [
        { provide: VendorPaymentMethodsService, useValue: mockService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<VendorPaymentMethodsController>(VendorPaymentMethodsController);
    service = module.get<VendorPaymentMethodsService>(VendorPaymentMethodsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should call service.findAll and return result", async () => {
      const result = [{ id: "pm-1", type: "bank" }];
      mockService.findAll.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.findAll(req)).toEqual(result);
      expect(mockService.findAll).toHaveBeenCalledWith("user-1");
    });
  });

  describe("addBank", () => {
    it("should call service.addBank and return result", async () => {
      const result = { id: "pm-1", type: "bank" };
      const body = { accountName: "John", accountNumber: "1234567890", bankName: "VCB" } as any;
      mockService.addBank.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.addBank(req, body)).toEqual(result);
      expect(mockService.addBank).toHaveBeenCalledWith("user-1", body);
    });
  });

  describe("addMomo", () => {
    it("should call service.addMomo and return result", async () => {
      const result = { id: "pm-2", type: "momo" };
      const body = { phone: "0987654321", name: "John" } as any;
      mockService.addMomo.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.addMomo(req, body)).toEqual(result);
      expect(mockService.addMomo).toHaveBeenCalledWith("user-1", body);
    });
  });

  describe("remove", () => {
    it("should call service.remove and return result", async () => {
      const result = { deleted: true };
      mockService.remove.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.remove(req, "bank", "pm-1")).toEqual(result);
      expect(mockService.remove).toHaveBeenCalledWith("user-1", "bank", "pm-1");
    });
  });

  describe("setDefault", () => {
    it("should call service.setDefault and return result", async () => {
      const result = { id: "pm-1", isDefault: true };
      mockService.setDefault.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.setDefault(req, "bank", "pm-1")).toEqual(result);
      expect(mockService.setDefault).toHaveBeenCalledWith("user-1", "bank", "pm-1");
    });
  });
});
