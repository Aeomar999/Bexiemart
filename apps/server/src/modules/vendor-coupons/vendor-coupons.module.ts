import { Module } from "@nestjs/common";
import { VendorCouponsController } from "./vendor-coupons.controller";
import { VendorCouponsService } from "./vendor-coupons.service";

@Module({ controllers: [VendorCouponsController], providers: [VendorCouponsService] })
export class VendorCouponsModule {}
