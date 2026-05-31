import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { VendorCustomersService } from "./vendor-customers.service";

@ApiTags("Vendor Customers")
@ApiBearerAuth()
@Controller("vendor/customers")
@UseGuards(AuthGuard)
export class VendorCustomersController {
  constructor(private readonly service: VendorCustomersService) {}

  @ApiOperation({ summary: "List all customers" })
  @Get() findAll(@Req() req: any) { return this.service.findAll(req.user.id); }
  @ApiOperation({ summary: "Get a customer by ID" })
  @Get(":id") findOne(@Req() req: any, @Param("id") id: string) { return this.service.findOne(req.user.id, id); }
}
