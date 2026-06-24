import { Module } from "@nestjs/common";
import { SupportController } from "./support.controller";
import { SupportService } from "./support.service";
import { AuthModule } from "../../auth/auth.module";
import { ChatModule } from "../chat/chat.module";

@Module({
  imports: [AuthModule, ChatModule],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
