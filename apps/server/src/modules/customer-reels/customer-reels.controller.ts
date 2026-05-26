import { Controller, Get, Post, Param, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../../guards/auth.guard";
import { CustomerReelsService } from "./customer-reels.service";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("Customer Reels")
@Controller("reels")
@UseGuards(AuthGuard)
export class CustomerReelsController {
  constructor(private readonly service: CustomerReelsService) {}

  @Get()
  @ApiOperation({ summary: "List reels for the current user" })
  findAll(@Req() req: any) { return this.service.findAll(req.user.id); }

  @Post(":id/like")
  @ApiOperation({ summary: "Toggle like on a reel" })
  toggleLike(@Req() req: any, @Param("id") id: string) { return this.service.toggleLike(req.user.id, id); }

  @Post(":id/view")
  @ApiOperation({ summary: "Increment reel view count" })
  incrementView(@Param("id") id: string) { return this.service.incrementView(id); }

  @Get("following")
  @ApiOperation({ summary: "List reels from followed users" })
  findFollowing(@Req() req: any) { return this.service.findFollowing(req.user.id); }
}
