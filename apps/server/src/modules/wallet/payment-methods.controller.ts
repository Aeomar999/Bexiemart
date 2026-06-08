import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
} from "@nestjs/common";
import { AuthGuard } from "../../guards/auth.guard";
import { WalletService } from "./wallet.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AddCardPaymentMethodDto, AddMomoPaymentMethodDto } from "./dto/payment-method.dto";

@ApiTags("Payment Methods")
@ApiBearerAuth()
@Controller("payment-methods")
@UseGuards(AuthGuard)
export class PaymentMethodsController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: "Get all payment methods" })
  async getAll(@Req() req: any) {
    const [cards, momoAccounts, bankAccounts] = await Promise.all([
      this.walletService.getCards(req.user.id),
      this.walletService.getMomoAccounts(req.user.id),
      this.walletService.getBankAccounts(req.user.id),
    ]);

    // Map to a unified format expected by the frontend
    const mappedCards = cards.map((c) => ({
      id: c.id,
      type: "card",
      provider: c.type,
      details: `**** **** **** ${c.last4}`,
      holderName: c.cardholderName || "Cardholder",
      isDefault: c.isDefault,
    }));

    const mappedMomo = momoAccounts.map((m) => ({
      id: m.id,
      type: "momo",
      provider: m.provider,
      details: m.phoneNumber,
      holderName: m.accountName,
      isDefault: m.isDefault,
    }));

    return {
      success: true,
      data: [...mappedCards, ...mappedMomo],
    };
  }

  @Post("card")
  @ApiOperation({ summary: "Add a card" })
  async addCard(@Req() req: any, @Body() body: AddCardPaymentMethodDto) {
    const [month, year] = body.expiry.split("/");

    const newCard = await this.walletService.addCard(req.user.id, {
      type: body.provider || "Card",
      cardholderName: body.holderName || "Cardholder",
      last4: body.details.slice(-4),
      expiryMonth: month?.trim() || "01",
      expiryYear: year?.trim() || "25",
      isDefault: body.isDefault,
    });

    return { success: true, data: newCard };
  }

  @Post("momo")
  @ApiOperation({ summary: "Add a momo account" })
  async addMomo(@Req() req: any, @Body() body: AddMomoPaymentMethodDto) {
    const newMomo = await this.walletService.linkMomoAccount(req.user.id, {
      provider: body.provider.toUpperCase(),
      phoneNumber: body.details,
      accountName: body.holderName || "Account Holder",
      isDefault: body.isDefault,
    });

    return { success: true, data: newMomo };
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remove a payment method" })
  async remove(@Req() req: any, @Param("id") id: string) {
    try {
      await this.walletService.deleteCard(req.user.id, id);
      return { success: true };
    } catch (err) {
      try {
        await this.walletService.deleteMomoAccount(req.user.id, id);
        return { success: true };
      } catch (err2) {
        throw new BadRequestException("Payment method not found");
      }
    }
  }

  @Patch(":id/default")
  @ApiOperation({ summary: "Set a payment method as default" })
  async setDefault(@Req() req: any, @Param("id") id: string) {
    try {
      await this.walletService.setDefaultCard(req.user.id, id);
      return { success: true };
    } catch (err) {
      throw new BadRequestException("Could not set default payment method");
    }
  }
}
