import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { AuthGuard } from "../../guards/auth.guard";
import { FoodService } from "./food.service";
import { AddFoodCartItemDto } from "./dto/add-food-cart-item.dto";
import { UpdateFoodCartItemDto } from "./dto/update-food-cart-item.dto";
import { CheckoutFoodDto } from "./dto/checkout-food.dto";
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from "@nestjs/swagger";

// Browse endpoints (restaurants, items) are public so guests can explore;
// cart, checkout and order routes are guarded per-method below.
@ApiTags("Food")
@ApiBearerAuth()
@Controller("food")
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  @Get("restaurants")
  @ApiOperation({ summary: "List restaurants, optionally filtered by category" })
  getRestaurants(
    @Query("category") category?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.foodService.getRestaurants(category, Number(page) || 1, Number(limit) || 20);
  }

  @Get("restaurants/:id")
  @ApiOperation({ summary: "Get a single restaurant by ID" })
  getRestaurant(@Param("id") id: string) {
    return this.foodService.getRestaurant(id);
  }

  @Get("items")
  @ApiOperation({ summary: "List food items, optionally filtered by category or search" })
  getFoodItems(
    @Query("category") category?: string,
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.foodService.getFoodItems(category, search, Number(page) || 1, Number(limit) || 20);
  }

  @Post("cart/add")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Add an item to the cart" })
  @ApiBody({ type: AddFoodCartItemDto })
  addToCart(@Req() req: any, @Body() body: AddFoodCartItemDto) {
    return this.foodService.addToCart(
      req.user.id,
      body.foodItemId,
      body.quantity,
      body.specialInstructions
    );
  }

  @Get("cart")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Get the current user's cart" })
  getCart(@Req() req: any) {
    return this.foodService.getCart(req.user.id);
  }

  @Put("cart/item/:id")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Update a cart item quantity" })
  @ApiBody({ type: UpdateFoodCartItemDto })
  updateCartItem(@Req() req: any, @Param("id") id: string, @Body() body: UpdateFoodCartItemDto) {
    return this.foodService.updateCartItem(req.user.id, id, body.quantity);
  }

  @Delete("cart/item/:id")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Remove a cart item by ID" })
  removeCartItem(@Req() req: any, @Param("id") id: string) {
    return this.foodService.removeCartItem(req.user.id, id);
  }

  @Delete("cart")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Clear the entire cart" })
  clearCart(@Req() req: any) {
    return this.foodService.clearCart(req.user.id);
  }

  @Post("checkout")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Checkout and place an order" })
  checkout(@Req() req: any, @Body() dto: CheckoutFoodDto) {
    return this.foodService.checkout(req.user.id, dto);
  }

  @Get("orders")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "List current user's orders" })
  getOrders(@Req() req: any, @Query("page") page?: string, @Query("limit") limit?: string) {
    return this.foodService.getOrders(req.user.id, Number(page) || 1, Number(limit) || 20);
  }

  @Get("orders/:id")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Get a single order by ID" })
  getOrder(@Req() req: any, @Param("id") id: string) {
    return this.foodService.getOrder(req.user.id, id);
  }
}
