import { Controller, Get, Query, ParseEnumPipe } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { BannerPlacement } from "@prisma/client";
import { BannersService } from "./banners.service";

@ApiTags("Banners")
@Controller("banners")
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  // Public browse endpoint: active promotional banners are shown to guests too.
  @Get("active")
  @ApiOperation({ summary: "Get active banners for a placement" })
  @ApiQuery({ name: "placement", enum: BannerPlacement })
  findActive(@Query("placement", new ParseEnumPipe(BannerPlacement)) placement: BannerPlacement) {
    return this.bannersService.findActive(placement);
  }
}
