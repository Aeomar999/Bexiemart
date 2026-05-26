import { Module } from "@nestjs/common";
import { VendorReviewsController } from "./vendor-reviews.controller";
import { VendorReviewsService } from "./vendor-reviews.service";

@Module({ controllers: [VendorReviewsController], providers: [VendorReviewsService] })
export class VendorReviewsModule {}
