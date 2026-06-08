import { Test, TestingModule } from "@nestjs/testing";
import { AddressesController } from "./addresses.controller";
import { AddressesService } from "./addresses.service";
import { AuthGuard } from "../../guards/auth.guard";

describe("AddressesController", () => {
  let controller: AddressesController;
  let service: AddressesService;

  const mockService = {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    setDefault: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AddressesController],
      providers: [
        { provide: AddressesService, useValue: mockService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AddressesController>(AddressesController);
    service = module.get<AddressesService>(AddressesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should call service.findAll with user id", async () => {
      const result = [{ id: "addr-1" }];
      mockService.findAll.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.findAll(req)).toEqual(result);
      expect(mockService.findAll).toHaveBeenCalledWith("user-1");
    });
  });

  describe("create", () => {
    it("should call service.create with user id and dto", async () => {
      const result = { id: "addr-1" };
      mockService.create.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };
      const dto = { street: "123 Main St", city: "NYC" } as any;

      expect(await controller.create(req, dto)).toEqual(result);
      expect(mockService.create).toHaveBeenCalledWith("user-1", dto);
    });
  });

  describe("update", () => {
    it("should call service.update with user id, param id and dto", async () => {
      const result = { id: "addr-1" };
      mockService.update.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };
      const dto = { street: "456 Oak Ave" } as any;

      expect(await controller.update(req, "addr-1", dto)).toEqual(result);
      expect(mockService.update).toHaveBeenCalledWith("user-1", "addr-1", dto);
    });
  });

  describe("remove", () => {
    it("should call service.remove with user id and param id", async () => {
      const result = { deleted: true };
      mockService.remove.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.remove(req, "addr-1")).toEqual(result);
      expect(mockService.remove).toHaveBeenCalledWith("user-1", "addr-1");
    });
  });

  describe("setDefault", () => {
    it("should call service.setDefault with user id and param id", async () => {
      const result = { id: "addr-1", isDefault: true };
      mockService.setDefault.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.setDefault(req, "addr-1")).toEqual(result);
      expect(mockService.setDefault).toHaveBeenCalledWith("user-1", "addr-1");
    });
  });
});
