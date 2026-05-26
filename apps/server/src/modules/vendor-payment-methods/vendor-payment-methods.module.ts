import { Module } from "@nestjs/common";
import { VendorPaymentMethodsController } from "./vendor-payment-methods.controller";
import { VendorPaymentMethodsService } from "./vendor-payment-methods.service";

@Module({ controllers: [VendorPaymentMethodsController], providers: [VendorPaymentMethodsService] })
export class VendorPaymentMethodsModule {}
