import { Controller, Get } from "@nestjs/common";
import { FlashSalesService } from "./flash-sales.service";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("Flash Sale")
@Controller("flash-sales")
export class FlashSalesController {
  constructor(private readonly flashSalesService: FlashSalesService) {}

  // Public browse endpoint: active flash sales are shown to guests too.
  @Get("active")
  @ApiOperation({ summary: "Get active flash sales" })
  findActive() {
    return this.flashSalesService.findActive();
  }
}
