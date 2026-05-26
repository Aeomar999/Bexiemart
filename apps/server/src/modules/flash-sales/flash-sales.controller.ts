import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../../guards/auth.guard";
import { FlashSalesService } from "./flash-sales.service";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("Flash Sale")
@Controller("flash-sales")
@UseGuards(AuthGuard)
export class FlashSalesController {
  constructor(private readonly flashSalesService: FlashSalesService) {}

  @Get("active")
  @ApiOperation({ summary: "Get active flash sales" })
  findActive() {
    return this.flashSalesService.findActive();
  }
}
