import { Controller, Get, Post, Delete, Patch, Param, Body, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { VendorPaymentMethodsService } from "./vendor-payment-methods.service";
import { AddBankAccountDto } from "./dto/add-bank-account.dto";
import { AddMomoAccountDto } from "./dto/add-momo-account.dto";

@ApiTags("Vendor Payment Methods")
@ApiBearerAuth()
@Controller("vendor/payment-methods")
@UseGuards(AuthGuard)
export class VendorPaymentMethodsController {
  constructor(private readonly service: VendorPaymentMethodsService) {}

  @ApiOperation({ summary: "List all payment methods" })
  @Get() findAll(@Req() req: any) { return this.service.findAll(req.user.id); }
  @ApiOperation({ summary: "Add a bank account" })
  @ApiBody({ type: AddBankAccountDto })
  @Post("bank") addBank(@Req() req: any, @Body() body: AddBankAccountDto) { return this.service.addBank(req.user.id, body); }
  @ApiOperation({ summary: "Add a MoMo account" })
  @ApiBody({ type: AddMomoAccountDto })
  @Post("momo") addMomo(@Req() req: any, @Body() body: AddMomoAccountDto) { return this.service.addMomo(req.user.id, body); }
  @ApiOperation({ summary: "Remove a payment method" })
  @Delete(":type/:id") remove(@Req() req: any, @Param("type") type: string, @Param("id") id: string) { return this.service.remove(req.user.id, type, id); }
  @ApiOperation({ summary: "Set default payment method" })
  @Patch(":type/:id/default") setDefault(@Req() req: any, @Param("type") type: string, @Param("id") id: string) { return this.service.setDefault(req.user.id, type, id); }
}
