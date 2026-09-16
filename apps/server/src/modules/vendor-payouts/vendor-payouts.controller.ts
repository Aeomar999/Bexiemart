import { Controller, Post, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { SuperAdminGuard } from "../../guards/super-admin.guard";
import { VendorPayoutsService } from "./vendor-payouts.service";

@ApiBearerAuth()
@ApiTags("Vendor Payouts")
@Controller("admin/payouts")
@UseGuards(AuthGuard, SuperAdminGuard)
export class VendorPayoutsController {
  constructor(private readonly payoutsService: VendorPayoutsService) {}

  @ApiOperation({ summary: "Manually trigger weekly vendor payouts" })
  @Post("trigger")
  async triggerPayouts() {
    return this.payoutsService.processPayouts();
  }
}
