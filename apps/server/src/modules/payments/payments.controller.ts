import { Controller, Post, Get, Param, Body, UseGuards, Req, Headers } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { PaymentsService } from "./payments.service";
import { InitializePaymentDto } from "./dto/initialize-payment.dto";

@Controller("payments")
@ApiTags("Payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiOperation({ summary: "Initialize a payment" })
  @ApiBody({ type: InitializePaymentDto })
  @Post("initialize")
  @UseGuards(AuthGuard)
  initialize(@Req() req: any, @Body() dto: InitializePaymentDto) {
    return this.paymentsService.initialize(req.user.id, dto);
  }

  @ApiOperation({ summary: "Verify a payment" })
  @Get("verify/:reference")
  @UseGuards(AuthGuard)
  verify(@Req() req: any, @Param("reference") reference: string) {
    return this.paymentsService.verify(req.user.id, reference);
  }

  @ApiOperation({ summary: "Handle payment webhook" })
  @Post("webhook")
  handleWebhook(@Body() body: any) {
    return this.paymentsService.handleWebhook(body);
  }

  @ApiOperation({ summary: "Charge a saved card" })
  @Post("charge-card")
  @UseGuards(AuthGuard)
  chargeCard(@Req() req: any, @Body() body: { orderId: string; cardId: string }) {
    return this.paymentsService.chargeAuthorization(req.user.id, body.orderId, body.cardId);
  }
}
