import { Module } from "@nestjs/common";
import { CustomerReelsController } from "./customer-reels.controller";
import { CustomerReelsService } from "./customer-reels.service";

@Module({ controllers: [CustomerReelsController], providers: [CustomerReelsService] })
export class CustomerReelsModule {}
