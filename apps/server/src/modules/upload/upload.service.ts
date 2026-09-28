import {
  Injectable,
  BadRequestException,
  BadGatewayException,
  ServiceUnavailableException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary, UploadApiOptions } from "cloudinary";
import { randomUUID } from "crypto";

export const IMAGE_UPLOAD_MAX_BYTES = 10 * 1024 * 1024; // 10MB
export const DOCUMENT_UPLOAD_MAX_BYTES = 10 * 1024 * 1024; // 10MB
// Cloudinary's upload ceiling for video on the free/Plus tiers without chunking.
export const VIDEO_UPLOAD_MAX_BYTES = 100 * 1024 * 1024; // 100MB

// Declared mimetypes accepted at the edge. Cloudinary re-checks the real bytes
// against IMAGE_FORMATS, so a renamed HTML/SVG file is still rejected.
export const IMAGE_MIME_PATTERN = /^image\/(jpe?g|png|webp|hei[cf])$/i;
export const DOCUMENT_MIME_PATTERN = /^(application\/pdf|image\/(jpe?g|png|webp|hei[cf]))$/i;
const IMAGE_FORMATS = ["jpg", "jpeg", "png", "webp", "heic", "heif"];

// Reels are transcoded once (eager, async) into an H.264 MP4 every phone can
// play plus a poster frame. Clients build delivery URLs from these exact
// strings so they hit the pre-generated derivatives.
export const REEL_VIDEO_TRANSFORMATION = "c_limit,h_1280,w_720,q_auto,vc_h264";
export const REEL_POSTER_TRANSFORMATION = "so_0,c_limit,h_1280,w_720,q_auto";
const REEL_EAGER = `${REEL_VIDEO_TRANSFORMATION}/mp4|${REEL_POSTER_TRANSFORMATION}/jpg`;

export type UploadResult = { url: string; public_id: string; filename: string };

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly cloudName?: string;
  private readonly apiKey?: string;
  private readonly apiSecret?: string;

  constructor(private readonly configService: ConfigService) {
    this.cloudName = this.configService.get<string>("CLOUDINARY_CLOUD_NAME");
    this.apiKey = this.configService.get<string>("CLOUDINARY_API_KEY");
    this.apiSecret = this.configService.get<string>("CLOUDINARY_API_SECRET");
    cloudinary.config({
      cloud_name: this.cloudName,
      api_key: this.apiKey,
      api_secret: this.apiSecret,
    });
  }

  private ensureConfigured() {
    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      this.logger.error("Cloudinary credentials are missing; uploads are disabled");
      throw new ServiceUnavailableException("File uploads are temporarily unavailable");
    }
  }

  getSignature(folder?: string) {
    this.ensureConfigured();
    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign: Record<string, any> = {
      timestamp,
      // Add validation constraints natively into the Cloudinary signature
      // so attackers cannot bypass constraints if uploading directly.
      allowed_formats: "jpg,png,webp,jpeg",
    };
    if (folder) {
      paramsToSign.folder = folder;
    }

    const signature = cloudinary.utils.api_sign_request(paramsToSign, this.apiSecret!);

    return {
      timestamp,
      signature,
      api_key: this.apiKey,
      cloud_name: this.cloudName,
      folder,
      allowed_formats: "jpg,png,webp,jpeg",
    };
  }

  getVideoSignature(folder = "reels") {
    this.ensureConfigured();
    const timestamp = Math.round(Date.now() / 1000);
    // Sign exactly the form fields the client posts. resource_type travels in
    // the URL path and Cloudinary leaves it out of the signature check, so
    // signing it here would make every upload fail with "Invalid Signature".
    const paramsToSign: Record<string, any> = {
      timestamp,
      folder,
      eager: REEL_EAGER,
      eager_async: true,
    };
    const signature = cloudinary.utils.api_sign_request(paramsToSign, this.apiSecret!);
    return {
      timestamp,
      signature,
      api_key: this.apiKey,
      cloud_name: this.cloudName,
      folder,
      resource_type: "video",
      eager: REEL_EAGER,
      eager_async: true,
      video_transformation: REEL_VIDEO_TRANSFORMATION,
      poster_transformation: REEL_POSTER_TRANSFORMATION,
      max_bytes: VIDEO_UPLOAD_MAX_BYTES,
    };
  }

  async uploadFile(file: Express.Multer.File, folder?: string): Promise<UploadResult> {
    if (!file) throw new BadRequestException("No file provided");
    this.ensureConfigured();
    return this.streamUpload(file.buffer, this.imageOptions(file, folder || "bexiemart"));
  }

  // Registration certificates and IDs are KYC data: stored as private assets,
  // reachable only through signed URLs the server issues (e.g. Cloudinary's
  // private_download_url), never through a public delivery URL.
  async uploadDocument(file: Express.Multer.File): Promise<UploadResult> {
    if (!file) throw new BadRequestException("No file provided");
    this.ensureConfigured();

    if (file.mimetype === "application/pdf") {
      if (!file.buffer?.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
        throw new BadRequestException("File is not a valid PDF");
      }
      // The extension in a raw public_id sets the served content type.
      return this.streamUpload(file.buffer, {
        folder: "vendor-documents",
        resource_type: "raw",
        type: "private",
        public_id: `${randomUUID()}.pdf`,
      });
    }

    return this.streamUpload(file.buffer, {
      ...this.imageOptions(file, "vendor-documents"),
      type: "private",
    });
  }

  private imageOptions(file: Express.Multer.File, folder: string): UploadApiOptions {
    const isHeic = /hei[cf]$/i.test(file.mimetype ?? "");
    return {
      folder,
      resource_type: "image",
      allowed_formats: IMAGE_FORMATS,
      // iPhones shoot HEIC, which browsers and most Android devices can't
      // render — store a JPEG instead.
      ...(isHeic ? { format: "jpg" } : {}),
    };
  }

  private streamUpload(buffer: Buffer, options: UploadApiOptions): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error || !result) {
          this.logger.warn(`Cloudinary upload failed: ${error?.message ?? "empty response"}`);
          // 4xx from Cloudinary means the file itself was rejected (bad or
          // disallowed format) — tell the client. Anything else is on us.
          const httpCode = (error as { http_code?: number } | undefined)?.http_code;
          return reject(
            httpCode && httpCode >= 400 && httpCode < 500
              ? new BadRequestException(error!.message)
              : new BadGatewayException("Upload failed. Please try again.")
          );
        }
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
          filename: result.public_id, // For backwards compatibility
        });
      });

      uploadStream.end(buffer);
    });
  }
}
