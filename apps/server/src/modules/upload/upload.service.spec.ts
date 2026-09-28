import {
  BadGatewayException,
  BadRequestException,
  ServiceUnavailableException,
} from "@nestjs/common";

jest.mock("cloudinary", () => ({
  v2: {
    config: jest.fn(),
    utils: { api_sign_request: jest.fn().mockReturnValue("signed") },
    uploader: { upload_stream: jest.fn() },
  },
}));

import {
  UploadService,
  REEL_VIDEO_TRANSFORMATION,
  REEL_POSTER_TRANSFORMATION,
} from "./upload.service";

const { v2: cloudinary } = require("cloudinary");

function mockUploadResult(result: any, error: any = null) {
  const stream = { end: jest.fn() };
  cloudinary.uploader.upload_stream.mockImplementation((_opts: any, cb: any) => {
    cb(error, result);
    return stream;
  });
  return stream;
}

const file = (mimetype: string, buffer = Buffer.from("test")) =>
  ({ mimetype, buffer, size: buffer.length }) as Express.Multer.File;

describe("UploadService", () => {
  let service: UploadService;
  let config: { get: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    config = { get: jest.fn().mockReturnValue("test_value") };
    service = new UploadService(config as any);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should return signature", () => {
    const result = service.getSignature("folder-1");
    expect(result).toHaveProperty("timestamp");
    expect(result).toHaveProperty("signature");
    expect(result).toHaveProperty("api_key");
    expect(result.folder).toBe("folder-1");
  });

  describe("getVideoSignature", () => {
    it("signs only the fields the client posts (never resource_type)", () => {
      const result = service.getVideoSignature("reels-test");
      const [signed] = cloudinary.utils.api_sign_request.mock.calls[0];

      expect(signed).not.toHaveProperty("resource_type");
      expect(Object.keys(signed).sort()).toEqual(["eager", "eager_async", "folder", "timestamp"]);
      expect(signed.eager).toBe(result.eager);
      expect(result.folder).toBe("reels-test");
      expect(result.resource_type).toBe("video");
      expect(result.eager_async).toBe(true);
    });

    it("requests an H.264 mp4 and a jpg poster built from the advertised transformations", () => {
      const result = service.getVideoSignature();
      expect(result.folder).toBe("reels");
      expect(result.video_transformation).toBe(REEL_VIDEO_TRANSFORMATION);
      expect(result.poster_transformation).toBe(REEL_POSTER_TRANSFORMATION);
      expect(result.eager).toBe(
        `${REEL_VIDEO_TRANSFORMATION}/mp4|${REEL_POSTER_TRANSFORMATION}/jpg`
      );
      expect(REEL_VIDEO_TRANSFORMATION).toContain("vc_h264");
      expect(result.max_bytes).toBe(100 * 1024 * 1024);
    });
  });

  describe("uploadFile", () => {
    it("uploads an image and returns url + public_id", async () => {
      const stream = mockUploadResult({
        secure_url: "https://cdn.example.com/img.jpg",
        public_id: "img",
      });
      const result = await service.uploadFile(file("image/jpeg"), "folder-1");

      expect(result).toEqual({
        url: "https://cdn.example.com/img.jpg",
        public_id: "img",
        filename: "img",
      });
      expect(stream.end).toHaveBeenCalled();
      const [opts] = cloudinary.uploader.upload_stream.mock.calls[0];
      expect(opts).toMatchObject({ folder: "folder-1", resource_type: "image" });
      expect(opts.allowed_formats).toEqual(expect.arrayContaining(["jpg", "png", "webp", "heic"]));
      expect(opts.format).toBeUndefined();
    });

    it.each(["image/heic", "image/heif"])("converts %s to jpg on ingest", async (mime) => {
      mockUploadResult({ secure_url: "https://cdn.example.com/img.jpg", public_id: "img" });
      await service.uploadFile(file(mime));
      const [opts] = cloudinary.uploader.upload_stream.mock.calls[0];
      expect(opts.format).toBe("jpg");
      expect(opts.folder).toBe("bexiemart");
    });

    it("maps a Cloudinary 4xx (rejected file) to BadRequest with its message", async () => {
      mockUploadResult(undefined, { http_code: 400, message: "Invalid image file" });
      await expect(service.uploadFile(file("image/png"))).rejects.toThrow(
        new BadRequestException("Invalid image file")
      );
    });

    it("maps Cloudinary outages to BadGateway", async () => {
      mockUploadResult(undefined, { http_code: 500, message: "boom" });
      await expect(service.uploadFile(file("image/png"))).rejects.toBeInstanceOf(
        BadGatewayException
      );
    });

    it("rejects instead of hanging when Cloudinary returns neither error nor result", async () => {
      mockUploadResult(undefined, null);
      await expect(service.uploadFile(file("image/png"))).rejects.toBeInstanceOf(
        BadGatewayException
      );
    });

    it("should reject when no file provided", async () => {
      await expect(service.uploadFile(null as any)).rejects.toThrow("No file provided");
    });
  });

  describe("uploadDocument", () => {
    it("uploads a real PDF as a private raw .pdf asset", async () => {
      mockUploadResult({
        secure_url: "https://cdn.example.com/raw/doc.pdf",
        public_id: "vendor-documents/abc.pdf",
      });
      const result = await service.uploadDocument(
        file("application/pdf", Buffer.from("%PDF-1.7\n..."))
      );

      expect(result.url).toBe("https://cdn.example.com/raw/doc.pdf");
      const [opts] = cloudinary.uploader.upload_stream.mock.calls[0];
      expect(opts).toMatchObject({
        folder: "vendor-documents",
        resource_type: "raw",
        type: "private",
      });
      expect(opts.public_id).toMatch(/\.pdf$/);
    });

    it("rejects a file that claims to be a PDF but isn't", async () => {
      await expect(
        service.uploadDocument(file("application/pdf", Buffer.from("<html>")))
      ).rejects.toThrow("File is not a valid PDF");
      expect(cloudinary.uploader.upload_stream).not.toHaveBeenCalled();
    });

    it("stores image documents privately through the image pipeline", async () => {
      mockUploadResult({ secure_url: "https://cdn.example.com/doc.jpg", public_id: "doc" });
      await service.uploadDocument(file("image/heic"));
      const [opts] = cloudinary.uploader.upload_stream.mock.calls[0];
      expect(opts).toMatchObject({
        folder: "vendor-documents",
        resource_type: "image",
        type: "private",
        format: "jpg",
      });
    });
  });

  describe("when Cloudinary is not configured", () => {
    beforeEach(() => {
      config.get.mockReturnValue(undefined);
      service = new UploadService(config as any);
    });

    it("returns 503 for uploads instead of an opaque SDK error", async () => {
      await expect(service.uploadFile(file("image/png"))).rejects.toBeInstanceOf(
        ServiceUnavailableException
      );
      expect(cloudinary.uploader.upload_stream).not.toHaveBeenCalled();
    });

    it("returns 503 for signatures", () => {
      expect(() => service.getVideoSignature()).toThrow(ServiceUnavailableException);
      expect(() => service.getSignature()).toThrow(ServiceUnavailableException);
    });
  });
});
