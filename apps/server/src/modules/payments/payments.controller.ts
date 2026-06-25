import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  Headers,
  ForbiddenException,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import * as crypto from "crypto";
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { PaymentsService } from "./payments.service";
import { InitializePaymentDto } from "./dto/initialize-payment.dto";
import { ChargeCardDto } from "./dto/charge-card.dto";

@ApiBearerAuth()
@Controller("payments")
@ApiTags("Payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiOperation({ summary: "Initialize a payment" })
  @ApiBody({ type: InitializePaymentDto })
  @Post("initialize")
  @UseGuards(AuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
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
  handleWebhook(
    @Req() req: any,
    @Headers("x-paystack-signature") signature: string,
    @Body() body: any
  ) {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      // Fail closed: without the secret we cannot trust any webhook.
      throw new ForbiddenException("Webhook verification not configured");
    }

    // The signature must be verified against the exact bytes Paystack signed.
    // rawBody is provided by Nest (rawBody: true in main.ts); re-serializing
    // the parsed body would change the bytes and is therefore not a safe fallback.
    if (!req.rawBody || !signature) {
      throw new ForbiddenException("Invalid signature");
    }

    const hash = crypto.createHmac("sha512", secret).update(req.rawBody).digest("hex");

    const expected = Buffer.from(hash);
    const received = Buffer.from(signature);
    if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
      throw new ForbiddenException("Invalid signature");
    }

    return this.paymentsService.handleWebhook(body);
  }

  @ApiOperation({ summary: "Charge a saved card" })
  @Post("charge-card")
  @UseGuards(AuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  chargeCard(@Req() req: any, @Body() body: ChargeCardDto) {
    return this.paymentsService.chargeAuthorization(req.user.id, body.orderId, body.cardId);
  }
}
