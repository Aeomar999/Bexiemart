import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { AdminGateway } from "./admin.gateway";
import { SuperAdminGuard } from "../../guards/super-admin.guard";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [AdminController],
  providers: [AdminService, AdminGateway, SuperAdminGuard],
  exports: [AdminGateway],
})
export class AdminModule {}
