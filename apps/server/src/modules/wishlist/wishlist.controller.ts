import { Controller, Get, Post, Param, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { WishlistService } from "./wishlist.service";
import { AuthGuard } from "../../guards/auth.guard";
import { AuthenticatedRequest } from "../../types/request.types";

@ApiBearerAuth()
@Controller("wishlist")
@UseGuards(AuthGuard)
@ApiTags("Wishlist")
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @ApiOperation({ summary: "Get user's wishlist" })
  @Get()
  getWishlist(@Req() req: AuthenticatedRequest) {
    return this.wishlistService.getWishlist(req.user.id);
  }

  @ApiOperation({ summary: "Toggle product in wishlist" })
  @Post(":productId/toggle")
  toggleWishlist(@Req() req: AuthenticatedRequest, @Param("productId") productId: string) {
    return this.wishlistService.toggleWishlist(req.user.id, productId);
  }
}
