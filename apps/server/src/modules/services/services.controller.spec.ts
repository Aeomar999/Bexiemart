import { Test, TestingModule } from "@nestjs/testing";
import { ServicesController } from "./services.controller";
import { ServicesService } from "./services.service";
import { AuthGuard } from "../../guards/auth.guard";

describe("ServicesController", () => {
  let controller: ServicesController;
  let service: ServicesService;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [
        { provide: ServicesService, useValue: mockService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ServicesController>(ServicesController);
    service = module.get<ServicesService>(ServicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should call service.findAll and return result", async () => {
      const result = [{ id: "service-1" }];
      mockService.findAll.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.findAll(req)).toEqual(result);
      expect(mockService.findAll).toHaveBeenCalledWith("user-1");
    });
  });

  describe("findOne", () => {
    it("should call service.findOne and return result", async () => {
      const result = { id: "service-1" };
      mockService.findOne.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.findOne(req, "service-1")).toEqual(result);
      expect(mockService.findOne).toHaveBeenCalledWith("user-1", "service-1");
    });
  });

  describe("create", () => {
    it("should call service.create and return result", async () => {
      const result = { id: "service-1" };
      const dto = { name: "New Service", price: 100 } as any;
      mockService.create.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.create(req, dto)).toEqual(result);
      expect(mockService.create).toHaveBeenCalledWith("user-1", dto);
    });
  });

  describe("update", () => {
    it("should call service.update and return result", async () => {
      const result = { id: "service-1", name: "Updated" };
      const dto = { name: "Updated" } as any;
      mockService.update.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.update(req, "service-1", dto)).toEqual(result);
      expect(mockService.update).toHaveBeenCalledWith("user-1", "service-1", dto);
    });
  });

  describe("remove", () => {
    it("should call service.remove and return result", async () => {
      const result = { deleted: true };
      mockService.remove.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.remove(req, "service-1")).toEqual(result);
      expect(mockService.remove).toHaveBeenCalledWith("user-1", "service-1");
    });
  });
});
