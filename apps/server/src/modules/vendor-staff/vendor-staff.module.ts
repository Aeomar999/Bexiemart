import { Module } from "@nestjs/common";
import { VendorStaffController } from "./vendor-staff.controller";
import { VendorStaffService } from "./vendor-staff.service";

@Module({ controllers: [VendorStaffController], providers: [VendorStaffService] })
export class VendorStaffModule {}
