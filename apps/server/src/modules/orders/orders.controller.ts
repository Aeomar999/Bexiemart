import { Controller, Get, Post, Body, Param, UseGuards, Req, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { RequestRefundDto } from "./dto/request-refund.dto";

@ApiBearerAuth()
@Controller("orders")
@UseGuards(AuthGuard)
@ApiTags("Orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({ summary: "Create a new order" })
  @ApiBody({ type: CreateOrderDto })
  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  create(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(req.user.id, dto);
  }

  @ApiOperation({ summary: "Get all orders for current user" })
  @Get()
  findAll(@Req() req: any, @Query("page") page?: string, @Query("limit") limit?: string) {
    return this.ordersService.findAll(req.user.id, Number(page) || 1, Number(limit) || 20);
  }

  @ApiOperation({ summary: "Get an order by ID" })
  @Get(":id")
  findOne(@Req() req: any, @Param("id") id: string) {
    return this.ordersService.findOne(req.user.id, id);
  }

  @ApiOperation({ summary: "Cancel an order" })
  @Post(":id/cancel")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  cancel(@Req() req: any, @Param("id") id: string) {
    return this.ordersService.cancel(req.user.id, id);
  }

  @ApiOperation({ summary: "Request a refund for an order" })
  @ApiBody({ schema: { type: "object", properties: { reason: { type: "string" } } } })
  @Post(":id/request-refund")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  requestRefund(@Req() req: any, @Param("id") id: string, @Body() dto: RequestRefundDto) {
    return this.ordersService.requestRefund(req.user.id, id, dto.reason);
  }
}
