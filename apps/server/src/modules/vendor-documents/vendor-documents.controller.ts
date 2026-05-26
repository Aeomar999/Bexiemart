import { Controller, Get, Post, Delete, Param, Body, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { VendorDocumentsService } from "./vendor-documents.service";
import { CreateDocumentDto } from "./dto/create-document.dto";

@ApiTags("Vendor Documents")
@Controller("vendor/documents")
@UseGuards(AuthGuard)
export class VendorDocumentsController {
  constructor(private readonly service: VendorDocumentsService) {}

  @ApiOperation({ summary: "List all documents" })
  @Get() findAll(@Req() req: any) { return this.service.findAll(req.user.id); }
  @ApiOperation({ summary: "Upload a document" })
  @ApiBody({ type: CreateDocumentDto })
  @Post() create(@Req() req: any, @Body() body: CreateDocumentDto) { return this.service.create(req.user.id, body); }
  @ApiOperation({ summary: "Delete a document" })
  @Delete(":id") remove(@Req() req: any, @Param("id") id: string) { return this.service.remove(req.user.id, id); }
}
