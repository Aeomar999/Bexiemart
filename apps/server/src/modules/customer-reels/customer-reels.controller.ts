import { Controller, Get, Post, Param, Req, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../../guards/auth.guard";
import { OptionalAuthGuard } from "../../guards/optional-auth.guard";
import { CustomerReelsService } from "./customer-reels.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("Customer Reels")
@ApiBearerAuth()
@Controller("reels")
export class CustomerReelsController {
  constructor(private readonly service: CustomerReelsService) {}

  // Public feed: guests get reels with `liked: false`; signed-in users get
  // their per-reel like state via OptionalAuthGuard.
  @Get()
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: "List reels (personalized when authenticated)" })
  findAll(@Req() req: any, @Query("cursor") cursor?: string) {
    return this.service.findAll(req.user?.id, cursor);
  }

  @Post(":id/like")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Toggle like on a reel" })
  toggleLike(@Req() req: any, @Param("id") id: string) {
    return this.service.toggleLike(req.user.id, id);
  }

  // Public: view counts are bumped for guests and signed-in users alike.
  @Post(":id/view")
  @ApiOperation({ summary: "Increment reel view count" })
  incrementView(@Param("id") id: string) {
    return this.service.incrementView(id);
  }

  @Get("following")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "List reels from followed users" })
  findFollowing(@Req() req: any, @Query("cursor") cursor?: string) {
    return this.service.findFollowing(req.user.id, cursor);
  }
}
