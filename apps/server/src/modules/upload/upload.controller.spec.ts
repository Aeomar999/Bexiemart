import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { UploadController } from "./upload.controller";
import { UploadService } from "./upload.service";
import { AuthGuard } from "../../guards/auth.guard";

// Exercises the real multipart pipeline (multer limits + ParseFilePipe), with
// only the Cloudinary-facing service mocked.
describe("UploadController", () => {
  let app: INestApplication;
  let controller: UploadController;

  const mockService = {
    getSignature: jest.fn(),
    getVideoSignature: jest.fn(),
    uploadFile: jest.fn(),
    uploadDocument: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [{ provide: UploadService, useValue: mockService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UploadController>(UploadController);
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
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

  describe("POST /upload", () => {
    const uploaded = { url: "https://cdn/x.jpg", public_id: "x", filename: "x" };

    it.each([
      ["image/jpeg", "a.jpg"],
      ["image/png", "a.png"],
      ["image/webp", "a.webp"],
      ["image/heic", "a.heic"],
      ["image/heif", "a.heif"],
    ])("accepts %s", async (contentType, filename) => {
      mockService.uploadFile.mockResolvedValue(uploaded);
      const res = await request(app.getHttpServer())
        .post("/upload")
        .attach("file", Buffer.from("img"), { filename, contentType });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(uploaded);
      expect(mockService.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({ mimetype: contentType })
      );
    });

    it("rejects non-image types with a readable message", async () => {
      const res = await request(app.getHttpServer())
        .post("/upload")
        .attach("file", Buffer.from("<svg/>"), {
          filename: "a.svg",
          contentType: "image/svg+xml",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Unsupported image type. Use JPG, PNG, WebP or HEIC.");
      expect(mockService.uploadFile).not.toHaveBeenCalled();
    });

    it("rejects files over 10MB before they reach the service", async () => {
      const res = await request(app.getHttpServer())
        .post("/upload")
        .attach("file", Buffer.alloc(10 * 1024 * 1024 + 1), {
          filename: "big.jpg",
          contentType: "image/jpeg",
        });

      expect(res.status).toBe(413);
      expect(mockService.uploadFile).not.toHaveBeenCalled();
    });

    it("rejects a request with no file", async () => {
      const res = await request(app.getHttpServer()).post("/upload");
      expect(res.status).toBe(400);
      expect(mockService.uploadFile).not.toHaveBeenCalled();
    });
  });

  describe("POST /upload/document", () => {
    it("accepts a PDF", async () => {
      mockService.uploadDocument.mockResolvedValue({ url: "https://cdn/d.pdf" });
      const res = await request(app.getHttpServer())
        .post("/upload/document")
        .attach("file", Buffer.from("%PDF-1.7"), {
          filename: "cert.pdf",
          contentType: "application/pdf",
        });

      expect(res.status).toBe(201);
      expect(mockService.uploadDocument).toHaveBeenCalledWith(
        expect.objectContaining({ mimetype: "application/pdf" })
      );
    });

    it("rejects other document types", async () => {
      const res = await request(app.getHttpServer())
        .post("/upload/document")
        .attach("file", Buffer.from("PK"), {
          filename: "cert.docx",
          contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Unsupported document type. Use PDF, JPG, PNG, WebP or HEIC.");
      expect(mockService.uploadDocument).not.toHaveBeenCalled();
    });
  });
});
