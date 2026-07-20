import { Controller, Get, Post, Param, Req, Query, UseGuards, Body } from "@nestjs/common";
import { AuthGuard } from "../../guards/auth.guard";
import { OptionalAuthGuard } from "../../guards/optional-auth.guard";
import { CustomerReelsService } from "./customer-reels.service";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthenticatedRequest } from "../../types/request.types";

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
  findAll(@Req() req: AuthenticatedRequest, @Query("cursor") cursor?: string) {
    return this.service.findAll(req.user?.id, cursor);
  }

  @Post(":id/like")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Toggle like on a reel" })
  toggleLike(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
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
  findFollowing(@Req() req: AuthenticatedRequest, @Query("cursor") cursor?: string) {
    return this.service.findFollowing(req.user.id, cursor);
  }

  @Get(":id/comments")
  @ApiOperation({ summary: "List comments for a reel" })
  listComments(@Param("id") id: string, @Query("cursor") cursor?: string) {
    return this.service.listComments(id, cursor);
  }

  @Post(":id/comments")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Add a comment to a reel" })
  addComment(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() body: CreateCommentDto
  ) {
    return this.service.addComment(req.user.id, id, body.content);
  }
}
