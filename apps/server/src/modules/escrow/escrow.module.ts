import { Module } from "@nestjs/common";
import { EscrowController } from "./escrow.controller";
import { EscrowService } from "./escrow.service";
import { AdminModule } from "../admin/admin.module";

@Module({
  imports: [AdminModule],
  controllers: [EscrowController],
  providers: [EscrowService],
})
export class EscrowModule {}
