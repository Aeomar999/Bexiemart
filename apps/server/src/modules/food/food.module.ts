import { Module } from "@nestjs/common";
import { FoodController } from "./food.controller";
import { FoodService } from "./food.service";
import { DeliveryModule } from "../delivery/delivery.module";

@Module({
  imports: [DeliveryModule],
  controllers: [FoodController],
  providers: [FoodService],
})
export class FoodModule {}
