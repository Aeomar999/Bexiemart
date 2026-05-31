import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { ReviewsService } from "./reviews.service";
import { CreateReviewDto } from "./dto/create-review.dto";

@ApiBearerAuth()
@Controller("reviews")
@ApiTags("Reviews")
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiOperation({ summary: "Create a review" })
  @ApiBody({ type: CreateReviewDto })
  @Post()
  @UseGuards(AuthGuard)
  create(@Req() req: any, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user.id, dto);
  }

  @ApiOperation({ summary: "Get reviews for a product" })
  @Get("product/:productId")
  findByProduct(@Param("productId") productId: string) {
    return this.reviewsService.findByProduct(productId);
  }

  @ApiOperation({ summary: "Get product review statistics" })
  @Get("product/:productId/stats")
  getProductStats(@Param("productId") productId: string) {
    return this.reviewsService.getProductStats(productId);
  }

  @ApiOperation({ summary: "Delete a review" })
  @Delete(":id")
  @UseGuards(AuthGuard)
  remove(@Req() req: any, @Param("id") id: string) {
    return this.reviewsService.remove(req.user.id, id);
  }
}
