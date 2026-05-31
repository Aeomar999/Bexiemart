import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { WalletController } from "./wallet.controller";
import { PaymentMethodsController } from "./payment-methods.controller";
import { WalletService } from "./wallet.service";

@Module({
  imports: [ConfigModule],
  controllers: [WalletController, PaymentMethodsController],
  providers: [WalletService],
})
export class WalletModule {}
