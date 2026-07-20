import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { LoyaltyService } from "./loyalty.service";
import { IsInt, Min } from "class-validator";
import { AuthenticatedRequest } from "../../types/request.types";

class ConvertCoinsDto {
  @IsInt() @Min(1) coins: number;
}

@ApiTags("Loyalty")
@ApiBearerAuth()
@Controller("wallet/coins")
@UseGuards(AuthGuard)
export class LoyaltyController {
  constructor(private readonly loyalty: LoyaltyService) {}

  @Get()
  @ApiOperation({ summary: "Get BexieCoins balance and earn state" })
  getSummary(@Req() req: AuthenticatedRequest) {
    return this.loyalty.getSummary(req.user.id);
  }

  @Post("convert")
  @ApiOperation({ summary: "Convert BexieCoins to wallet balance" })
  convert(@Req() req: AuthenticatedRequest, @Body() body: ConvertCoinsDto) {
    return this.loyalty.convertCoinsToBalance(req.user.id, body.coins);
  }
}
