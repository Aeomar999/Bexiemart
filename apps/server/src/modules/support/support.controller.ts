import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { SupportService } from "./support.service";
import { CreateTicketDto } from "./dto/create-ticket.dto";

@ApiTags("Support")
@ApiBearerAuth()
@Controller("support")
@UseGuards(AuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post("tickets")
  @ApiOperation({ summary: "Create a support ticket (+ underlying conversation)" })
  @ApiBody({ type: CreateTicketDto })
  createTicket(@Req() req: any, @Body() body: CreateTicketDto) {
    return this.supportService.createTicket(req.user.id, body);
  }
}
