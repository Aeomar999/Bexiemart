import { Test, TestingModule } from "@nestjs/testing";
import { VendorDocumentsController } from "./vendor-documents.controller";
import { VendorDocumentsService } from "./vendor-documents.service";
import { AuthGuard } from "../../guards/auth.guard";

describe("VendorDocumentsController", () => {
  let controller: VendorDocumentsController;
  let service: VendorDocumentsService;

  const mockService = {
    findAll: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorDocumentsController],
      providers: [
        { provide: VendorDocumentsService, useValue: mockService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<VendorDocumentsController>(VendorDocumentsController);
    service = module.get<VendorDocumentsService>(VendorDocumentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should call service.findAll and return result", async () => {
      const result = [{ id: "doc-1" }];
      mockService.findAll.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.findAll(req)).toEqual(result);
      expect(mockService.findAll).toHaveBeenCalledWith("user-1");
    });
  });

  describe("create", () => {
    it("should call service.create and return result", async () => {
      const result = { id: "doc-1" };
      const body = { name: "license.pdf", url: "https://..." } as any;
      mockService.create.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.create(req, body)).toEqual(result);
      expect(mockService.create).toHaveBeenCalledWith("user-1", body);
    });
  });

  describe("remove", () => {
    it("should call service.remove and return result", async () => {
      const result = { deleted: true };
      mockService.remove.mockResolvedValue(result);
      const req = { user: { id: "user-1" } };

      expect(await controller.remove(req, "doc-1")).toEqual(result);
      expect(mockService.remove).toHaveBeenCalledWith("user-1", "doc-1");
    });
  });
});
