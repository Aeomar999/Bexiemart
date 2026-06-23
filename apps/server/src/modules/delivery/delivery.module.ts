import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { MapsModule } from "../maps/maps.module";
import { PricingService } from "./pricing.service";
import { DeliveryService } from "./delivery.service";
import { DeliveryController } from "./delivery.controller";
import { DeliveryGateway } from "./delivery.gateway";

@Module({
  imports: [AuthModule, MapsModule],
  controllers: [DeliveryController],
  providers: [PricingService, DeliveryService, DeliveryGateway],
  exports: [PricingService, DeliveryService],
})
export class DeliveryModule {}
