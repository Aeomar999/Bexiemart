import { Test, TestingModule } from "@nestjs/testing";
import { UploadController } from "./upload.controller";
import { UploadService } from "./upload.service";
import { AuthGuard } from "../../guards/auth.guard";

describe("UploadController", () => {
  let controller: UploadController;
  let service: UploadService;

  const mockService = {
    getSignature: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        { provide: UploadService, useValue: mockService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UploadController>(UploadController);
    service = module.get<UploadService>(UploadService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getSignature", () => {
    it("should call service.getSignature with folder", () => {
      const result = { signature: "abc123", timestamp: 123456 };
      mockService.getSignature.mockReturnValue(result);

      expect(controller.getSignature("products")).toEqual(result);
      expect(mockService.getSignature).toHaveBeenCalledWith("products");
    });

    it("should call service.getSignature without folder", () => {
      const result = { signature: "abc123", timestamp: 123456 };
      mockService.getSignature.mockReturnValue(result);

      expect(controller.getSignature()).toEqual(result);
      expect(mockService.getSignature).toHaveBeenCalledWith(undefined);
    });
  });
});
