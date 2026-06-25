import { Module } from "@nestjs/common";
import { DispatcherController } from "./dispatcher.controller";
import { DispatcherService } from "./dispatcher.service";
import { DeliveryModule } from "../delivery/delivery.module";

@Module({
  imports: [DeliveryModule],
  controllers: [DispatcherController],
  providers: [DispatcherService],
  exports: [DispatcherService],
})
export class DispatcherModule {}
