import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary } from "cloudinary";

@Injectable()
export class UploadService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>("CLOUDINARY_CLOUD_NAME"),
      api_key: this.configService.get<string>("CLOUDINARY_API_KEY"),
      api_secret: this.configService.get<string>("CLOUDINARY_API_SECRET"),
    });
  }

  getSignature(folder?: string) {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign: Record<string, any> = { timestamp };
    if (folder) {
      paramsToSign.folder = folder;
    }
    
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      this.configService.get<string>("CLOUDINARY_API_SECRET")!
    );
    
    return {
      timestamp,
      signature,
      api_key: this.configService.get<string>("CLOUDINARY_API_KEY"),
      cloud_name: this.configService.get<string>("CLOUDINARY_CLOUD_NAME"),
      folder
    };
  }

  async uploadFile(file: Express.Multer.File, folder?: string): Promise<{ url: string; public_id: string; filename: string }> {
    if (!file) throw new BadRequestException("No file provided");

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: folder || "bexiemart" },
        (error, result) => {
          if (error) return reject(new BadRequestException(error.message));
          if (result) {
            resolve({
              url: result.secure_url,
              public_id: result.public_id,
              filename: result.public_id // For backwards compatibility
            });
          }
        }
      );
      
      uploadStream.end(file.buffer);
    });
  }
}
