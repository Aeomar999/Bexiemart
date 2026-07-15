import { Module } from "@nestjs/common";
import { FlashSalesController } from "./flash-sales.controller";
import { FlashSalesService } from "./flash-sales.service";
import { FlashSalesSchedulerService } from "./flash-sales-scheduler.service";

@Module({
  controllers: [FlashSalesController],
  providers: [FlashSalesService, FlashSalesSchedulerService],
  exports: [FlashSalesService, FlashSalesSchedulerService],
})
export class FlashSalesModule {}
