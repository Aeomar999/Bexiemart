import { Module } from "@nestjs/common";
import { VendorHoursController } from "./vendor-hours.controller";
import { VendorHoursService } from "./vendor-hours.service";

@Module({ controllers: [VendorHoursController], providers: [VendorHoursService] })
export class VendorHoursModule {}
