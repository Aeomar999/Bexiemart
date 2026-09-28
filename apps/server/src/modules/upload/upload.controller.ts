import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Query,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileValidator,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuthGuard } from "../../guards/auth.guard";
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from "@nestjs/swagger";
import {
  UploadService,
  IMAGE_UPLOAD_MAX_BYTES,
  DOCUMENT_UPLOAD_MAX_BYTES,
  IMAGE_MIME_PATTERN,
  DOCUMENT_MIME_PATTERN,
} from "./upload.service";

// FileTypeValidator (Nest 10) can't take a custom message, and its default
// leaks the regex to end users.
class MimeTypeValidator extends FileValidator<{ pattern: RegExp; message: string }> {
  isValid(file?: Express.Multer.File): boolean {
    return !!file?.mimetype && this.validationOptions.pattern.test(file.mimetype);
  }

  buildErrorMessage(): string {
    return this.validationOptions.message;
  }
}

const imageFilePipe = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({
      maxSize: IMAGE_UPLOAD_MAX_BYTES,
      message: "Image is too large. Maximum size is 10MB.",
    }),
    new MimeTypeValidator({
      pattern: IMAGE_MIME_PATTERN,
      message: "Unsupported image type. Use JPG, PNG, WebP or HEIC.",
    }),
  ],
});

const documentFilePipe = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({
      maxSize: DOCUMENT_UPLOAD_MAX_BYTES,
      message: "Document is too large. Maximum size is 10MB.",
    }),
    new MimeTypeValidator({
      pattern: DOCUMENT_MIME_PATTERN,
      message: "Unsupported document type. Use PDF, JPG, PNG, WebP or HEIC.",
    }),
  ],
});

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

  @Get("signature/video")
  @ApiOperation({ summary: "Get a Cloudinary signature for direct video upload" })
  @ApiQuery({ name: "folder", required: false, type: String })
  getVideoSignature(@Query("folder") folder?: string) {
    return this.uploadService.getVideoSignature(folder);
  }

  // multer's fileSize limit aborts oversized bodies mid-stream (413) so they
  // are never buffered into memory; the pipe re-checks size and type.
  @Post()
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: IMAGE_UPLOAD_MAX_BYTES } }))
  @ApiOperation({ summary: "Upload a single image to Cloudinary" })
  async upload(@UploadedFile(imageFilePipe) file: Express.Multer.File) {
    return this.uploadService.uploadFile(file);
  }

  @Post("document")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: DOCUMENT_UPLOAD_MAX_BYTES } }))
  @ApiOperation({ summary: "Upload a business document (PDF or image) to Cloudinary" })
  async uploadDocument(@UploadedFile(documentFilePipe) file: Express.Multer.File) {
    return this.uploadService.uploadDocument(file);
  }
}
