import { Controller, Post, Get, UseInterceptors, UploadedFile, UseGuards, Query, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuthGuard } from "../../guards/auth.guard";
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from "@nestjs/swagger";
import { UploadService } from "./upload.service";

@ApiBearerAuth()
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
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.uploadService.uploadFile(file);
  }
}
