import { Controller, Post, UseInterceptors, UploadedFile, UseGuards } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuthGuard } from "../../guards/auth.guard";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { UploadService } from "./upload.service";

@Controller("upload")
@UseGuards(AuthGuard)
@ApiTags("Upload")
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "Upload a single file" })
  async upload(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadFile(file);
  }
}
