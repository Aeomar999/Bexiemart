import { Module } from "@nestjs/common";
import { VendorPayoutsService } from "./vendor-payouts.service";
import { VendorPayoutsController } from "./vendor-payouts.controller";
import { EscrowModule } from "../escrow/escrow.module";
import { WalletModule } from "../wallet/wallet.module";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
  imports: [EscrowModule, WalletModule, ScheduleModule.forRoot()],
  controllers: [VendorPayoutsController],
  providers: [VendorPayoutsService],
})
export class VendorPayoutsModule {}
