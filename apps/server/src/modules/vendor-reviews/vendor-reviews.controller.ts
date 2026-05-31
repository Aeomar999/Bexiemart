import { Controller, Get, Post, Param, Body, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { VendorReviewsService } from "./vendor-reviews.service";
import { ReplyReviewDto } from "./dto/reply-review.dto";

@ApiTags("Vendor Reviews")
@ApiBearerAuth()
@Controller("vendor/reviews")
@UseGuards(AuthGuard)
export class VendorReviewsController {
  constructor(private readonly service: VendorReviewsService) {}

  @ApiOperation({ summary: "List all reviews" })
  @Get() findAll(@Req() req: any) { return this.service.findAll(req.user.id); }
  @ApiOperation({ summary: "Reply to a review" })
  @ApiBody({ type: ReplyReviewDto })
  @Post(":id/reply") reply(@Req() req: any, @Param("id") id: string, @Body() dto: ReplyReviewDto) { return this.service.reply(req.user.id, id, dto.reply); }
}
