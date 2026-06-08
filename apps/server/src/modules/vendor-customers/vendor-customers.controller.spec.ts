import { Test, TestingModule } from "@nestjs/testing";
import { VendorCustomersController } from "./vendor-customers.controller";
import { VendorCustomersService } from "./vendor-customers.service";
import { AuthGuard } from "../../guards/auth.guard";

describe("VendorCustomersController", () => {
  let controller: VendorCustomersController;
  let service: VendorCustomersService;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorCustomersController],
      providers: [
        { provide: VendorCustomersService, useValue: mockService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<VendorCustomersController>(VendorCustomersController);
    service = module.get<VendorCustomersService>(VendorCustomersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should call service.findAll and return result", async () => {
      const result = [{ id: "customer-1" }];
      mockService.findAll.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.findAll(req)).toEqual(result);
      expect(mockService.findAll).toHaveBeenCalledWith("user-1");
    });
  });

  describe("findOne", () => {
    it("should call service.findOne and return result", async () => {
      const result = { id: "customer-1" };
      mockService.findOne.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.findOne(req, "customer-1")).toEqual(result);
      expect(mockService.findOne).toHaveBeenCalledWith("user-1", "customer-1");
    });
  });
});
