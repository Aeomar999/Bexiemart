import { Controller, Get, Post, Param, Body, UseGuards, Req } from "@nestjs/common";
import { AuthGuard } from "../../guards/auth.guard";
import { EscrowService } from "./escrow.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { DisputeEscrowDto } from "./dto/dispute-escrow.dto";

@ApiTags("Escrow")
@ApiBearerAuth()
@Controller("escrow")
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "List all escrows for the user" })
  list(@Req() req: any) {
    return this.escrowService.list(req.user.id);
  }

  @Get(":id")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Get escrow details by ID" })
  get(@Req() req: any, @Param("id") id: string) {
    return this.escrowService.get(req.user.id, id);
  }

  @Post(":id/dispute")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Open a dispute on an escrow" })
  dispute(@Req() req: any, @Param("id") id: string, @Body() body: DisputeEscrowDto) {
    return this.escrowService.dispute(req.user.id, id, body.reason);
  }

  @Post(":id/release")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Release funds from escrow" })
  release(@Req() req: any, @Param("id") id: string) {
    return this.escrowService.release(req.user.id, id);
  }

  @Post(":id/refund")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Refund funds from escrow" })
  refund(@Req() req: any, @Param("id") id: string) {
    return this.escrowService.refund(req.user.id, id);
  }
}
