import { Controller, Post, Get, UseInterceptors, UploadedFile, UseGuards, Query } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuthGuard } from "../../guards/auth.guard";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { UploadService } from "./upload.service";

@Controller("upload")
@UseGuards(AuthGuard)
@ApiTags("Upload")
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Get("signature")
  @ApiOperation({ summary: "Get a Cloudinary upload signature for client-side uploads" })
  @ApiQuery({ name: "folder", required: false, type: String })
  getSignature(@Query("folder") folder?: string) {
    return this.uploadService.getSignature(folder);
  }

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "Upload a single file to Cloudinary" })
  async upload(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadFile(file);
  }
}
