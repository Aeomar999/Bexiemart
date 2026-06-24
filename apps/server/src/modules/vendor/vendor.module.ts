import { Module } from "@nestjs/common";
import { VendorController } from "./vendor.controller";
import { VendorService } from "./vendor.service";
import { MapsModule } from "../maps/maps.module";

@Module({
  imports: [MapsModule],
  controllers: [VendorController],
  providers: [VendorService],
})
export class VendorModule {}
