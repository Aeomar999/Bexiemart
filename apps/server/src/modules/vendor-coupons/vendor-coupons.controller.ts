import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { VendorCouponsService } from "./vendor-coupons.service";
import { CreateVendorCouponDto, UpdateVendorCouponDto } from "./dto/vendor-coupon.dto";

@ApiTags("Vendor Coupons")
@Controller("vendor/coupons")
@UseGuards(AuthGuard)
export class VendorCouponsController {
  constructor(private readonly service: VendorCouponsService) {}

  @ApiOperation({ summary: "List all coupons" })
  @Get() findAll(@Req() req: any) { return this.service.findAll(req.user.id); }
  @ApiOperation({ summary: "Create a new coupon" })
  @ApiBody({ type: CreateVendorCouponDto })
  @Post() create(@Req() req: any, @Body() dto: CreateVendorCouponDto) { return this.service.create(req.user.id, dto); }
  @ApiOperation({ summary: "Update a coupon" })
  @ApiBody({ type: UpdateVendorCouponDto })
  @Put(":id") update(@Req() req: any, @Param("id") id: string, @Body() dto: UpdateVendorCouponDto) { return this.service.update(req.user.id, id, dto); }
  @ApiOperation({ summary: "Delete a coupon" })
  @Delete(":id") remove(@Req() req: any, @Param("id") id: string) { return this.service.remove(req.user.id, id); }
  @ApiOperation({ summary: "Toggle coupon active status" })
  @Patch(":id/toggle") toggle(@Req() req: any, @Param("id") id: string) { return this.service.toggle(req.user.id, id); }
}
