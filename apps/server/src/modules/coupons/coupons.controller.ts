import { Controller, Post, Body } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody } from "@nestjs/swagger";
import { CouponsService } from "./coupons.service";
import { ValidateCouponDto } from "./dto/validate-coupon.dto";

@Controller("coupons")
@ApiTags("Coupons")
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @ApiOperation({ summary: "Validate a coupon code" })
  @ApiBody({ type: ValidateCouponDto })
  @Post("validate")
  validate(@Body() dto: ValidateCouponDto) {
    return this.couponsService.validate(dto.code, dto.orderAmount);
  }
}
