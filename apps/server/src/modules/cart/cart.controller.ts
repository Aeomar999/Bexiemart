import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { CartService } from "./cart.service";
import { AddCartItemDto } from "./dto/add-cart-item.dto";
import { UpdateCartItemDto } from "./dto/update-cart-item.dto";
import { AuthenticatedRequest } from "../../types/request.types";

@ApiBearerAuth()
@Controller("cart")
@UseGuards(AuthGuard)
@ApiTags("Cart")
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @ApiOperation({ summary: "Get current user's cart" })
  @Get()
  getCart(@Req() req: AuthenticatedRequest) {
    return this.cartService.getCart(req.user.id);
  }

  @ApiOperation({ summary: "Add item to cart" })
  @ApiBody({ type: AddCartItemDto })
  @Post()
  addItem(@Req() req: AuthenticatedRequest, @Body() body: AddCartItemDto) {
    return this.cartService.addItem(req.user.id, body.productId, body.quantity);
  }

  @ApiOperation({ summary: "Update cart item quantity" })
  @ApiBody({ type: UpdateCartItemDto })
  @Put(":id")
  updateItem(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() body: UpdateCartItemDto
  ) {
    return this.cartService.updateItem(req.user.id, id, body.quantity);
  }

  @ApiOperation({ summary: "Remove item from cart" })
  @Delete(":id")
  removeItem(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.cartService.removeItem(req.user.id, id);
  }
}
