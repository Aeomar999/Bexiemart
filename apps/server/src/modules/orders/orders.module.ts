import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { DeliveryModule } from "../delivery/delivery.module";
import { AdminModule } from "../admin/admin.module";

@Module({
  imports: [DeliveryModule, AdminModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
