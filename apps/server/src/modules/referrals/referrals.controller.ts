import { Controller, Get, Post, Body, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../../guards/auth.guard";
import { ReferralsService } from "./referrals.service";
import { GenerateReferralDto } from "./dto/generate-referral.dto";
import { ApplyReferralDto } from "./dto/apply-referral.dto";
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("Referral")
@ApiBearerAuth()
@Controller("referrals")
@UseGuards(AuthGuard)
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Post("generate")
  @ApiOperation({ summary: "Generate a referral code" })
  @ApiBody({ type: GenerateReferralDto })
  generate(@Req() req: any, @Body() body: GenerateReferralDto) {
    return this.referralsService.generate(req.user.id);
  }

  @Get()
  @ApiOperation({ summary: "Get my referral code" })
  getMyReferral(@Req() req: any) {
    return this.referralsService.getMyReferral(req.user.id);
  }

  @Post("apply")
  @ApiOperation({ summary: "Apply a referral code" })
  @ApiBody({ type: ApplyReferralDto })
  apply(@Req() req: any, @Body() body: ApplyReferralDto) {
    return this.referralsService.apply(req.user.id, body.code);
  }

  @Get("stats")
  @ApiOperation({ summary: "Get referral stats" })
  getStats(@Req() req: any) {
    return this.referralsService.getStats(req.user.id);
  }
}
