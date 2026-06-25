import { Module } from "@nestjs/common";
import { VendorController } from "./vendor.controller";
import { VendorService } from "./vendor.service";
import { MapsModule } from "../maps/maps.module";
import { AdminModule } from "../admin/admin.module";

@Module({
  imports: [MapsModule, AdminModule],
  controllers: [VendorController],
  providers: [VendorService],
})
export class VendorModule {}
