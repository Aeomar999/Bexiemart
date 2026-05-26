import { randomUUID } from "crypto";
import { Injectable, BadRequestException } from "@nestjs/common";
import { extname, join } from "path";
import { writeFileSync, existsSync, mkdirSync } from "fs";

@Injectable()
export class UploadService {
  private readonly uploadDir = join(process.cwd(), "uploads");

  async uploadFile(file: Express.Multer.File): Promise<{ url: string; filename: string }> {
    if (!file) throw new BadRequestException("No file provided");

    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "application/pdf"];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} not allowed`);
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException("File too large (max 10MB)");
    }

    const ext = extname(file.originalname);
    const filename = `${randomUUID()}${ext}`;

    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }

    writeFileSync(join(this.uploadDir, filename), file.buffer);

    return { url: `/uploads/${filename}`, filename };
  }
}
