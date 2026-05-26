import { Module } from "@nestjs/common";
import { VendorCustomersController } from "./vendor-customers.controller";
import { VendorCustomersService } from "./vendor-customers.service";

@Module({ controllers: [VendorCustomersController], providers: [VendorCustomersService] })
export class VendorCustomersModule {}
