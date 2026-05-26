import { Controller, Get, Put, Body, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { VendorHoursService } from "./vendor-hours.service";
import { UpdateHoursDto } from "./dto/update-hours.dto";

@ApiTags("Vendor Hours")
@Controller("vendor/hours")
@UseGuards(AuthGuard)
export class VendorHoursController {
  constructor(private readonly service: VendorHoursService) {}

  @ApiOperation({ summary: "Get business hours" })
  @Get() findAll(@Req() req: any) { return this.service.findAll(req.user.id); }
  @ApiOperation({ summary: "Update business hours" })
  @ApiBody({ type: UpdateHoursDto })
  @Put() update(@Req() req: any, @Body() body: UpdateHoursDto) { return this.service.update(req.user.id, body.hours); }
}
