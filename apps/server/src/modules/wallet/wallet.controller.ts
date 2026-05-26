import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from "@nestjs/common";
import { AuthGuard } from "../../guards/auth.guard";
import { WalletService } from "./wallet.service";
import { TopupDto } from "./dto/topup.dto";
import { TransferDto } from "./dto/transfer.dto";
import { PinDto } from "./dto/pin.dto";
import { ChangePinDto } from "./dto/change-pin.dto";
import { ApiTags, ApiOperation, ApiBody } from "@nestjs/swagger";

@ApiTags("Wallet")
@Controller("wallet")
@UseGuards(AuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: "Get wallet balance and details" })
  getWallet(@Req() req: any) {
    return this.walletService.getWallet(req.user.id);
  }

  @Get("transactions")
  @ApiOperation({ summary: "Get wallet transaction history" })
  getTransactions(@Req() req: any, @Query("page") page?: string) {
    return this.walletService.getTransactions(req.user.id, page ? parseInt(page) : 1);
  }

  @Post("topup/initialize")
  @ApiOperation({ summary: "Initialize a wallet top-up" })
  @ApiBody({ type: TopupDto })
  initializeTopUp(@Req() req: any, @Body() body: TopupDto) {
    return this.walletService.initializeTopUp(req.user.id, body.amount, body.channel || "MOMO");
  }

  @Get("topup/verify/:reference")
  @ApiOperation({ summary: "Verify a top-up payment reference" })
  verifyTopUp(@Req() req: any, @Param("reference") reference: string) {
    return this.walletService.verifyTopUp(req.user.id, reference);
  }

  @Post("transfer")
  @ApiOperation({ summary: "Transfer funds to another user" })
  @ApiBody({ type: TransferDto })
  transfer(@Req() req: any, @Body() body: TransferDto) {
    // In a real app we'd verify the pin here before transferring
    return this.walletService.transfer(req.user.id, body.recipientEmail, body.amount);
  }

  @Post("pin")
  @ApiOperation({ summary: "Set wallet transaction PIN" })
  @ApiBody({ type: PinDto })
  setPin(@Req() req: any, @Body() body: PinDto) {
    return this.walletService.setPin(req.user.id, body.pin);
  }

  @Post("pin/change")
  @ApiOperation({ summary: "Change wallet transaction PIN" })
  @ApiBody({ type: ChangePinDto })
  changePin(@Req() req: any, @Body() body: ChangePinDto) {
    return this.walletService.changePin(req.user.id, body.currentPin, body.newPin);
  }

  @Post("pin/verify")
  @ApiOperation({ summary: "Verify wallet transaction PIN" })
  @ApiBody({ type: PinDto })
  verifyPin(@Req() req: any, @Body() body: PinDto) {
    return this.walletService.verifyPin(req.user.id, body.pin);
  }

  @Post("pin/reset")
  @ApiOperation({ summary: "Reset PIN failure count" })
  resetPinFailures(@Req() req: any) {
    return this.walletService.resetPinFailures(req.user.id);
  }

  @Get("pin/status")
  @ApiOperation({ summary: "Get wallet PIN status" })
  getPinStatus(@Req() req: any) {
    return this.walletService.getPinStatus(req.user.id);
  }
}

