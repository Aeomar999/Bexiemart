import { Controller, Get, Put, Body, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { VendorHoursService } from "./vendor-hours.service";
import { UpdateHoursDto } from "./dto/update-hours.dto";
import { AuthenticatedRequest } from "../../types/request.types";

@ApiTags("Vendor Hours")
@ApiBearerAuth()
@Controller("vendor/hours")
@UseGuards(AuthGuard)
export class VendorHoursController {
  constructor(private readonly service: VendorHoursService) {}

  @ApiOperation({ summary: "Get business hours" })
  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.service.findAll(req.user.id);
  }
  @ApiOperation({ summary: "Update business hours" })
  @ApiBody({ type: UpdateHoursDto })
  @Put()
  update(@Req() req: AuthenticatedRequest, @Body() body: UpdateHoursDto) {
    return this.service.update(req.user.id, body.hours);
  }
}
