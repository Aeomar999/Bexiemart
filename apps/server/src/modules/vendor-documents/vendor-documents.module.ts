import { Module } from "@nestjs/common";
import { VendorDocumentsController } from "./vendor-documents.controller";
import { VendorDocumentsService } from "./vendor-documents.service";

@Module({ controllers: [VendorDocumentsController], providers: [VendorDocumentsService] })
export class VendorDocumentsModule {}
