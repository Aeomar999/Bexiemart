import { Controller, Get, Post, Body, Param, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";

@Controller("orders")
@UseGuards(AuthGuard)
@ApiTags("Orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({ summary: "Create a new order" })
  @ApiBody({ type: CreateOrderDto })
  @Post()
  create(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(req.user.id, dto);
  }

  @ApiOperation({ summary: "Get all orders for current user" })
  @Get()
  findAll(@Req() req: any) {
    return this.ordersService.findAll(req.user.id);
  }

  @ApiOperation({ summary: "Get an order by ID" })
  @Get(":id")
  findOne(@Req() req: any, @Param("id") id: string) {
    return this.ordersService.findOne(req.user.id, id);
  }
}
