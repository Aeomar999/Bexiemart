import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { SupportService } from "./support.service";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { RateTicketDto } from "./dto/rate-ticket.dto";

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

  @Get("tickets")
  @ApiOperation({ summary: "List customer support tickets" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  listTickets(@Req() req: any, @Query("page") page = "1", @Query("limit") limit = "20") {
    return this.supportService.listMyTickets(req.user.id, Number(page), Number(limit));
  }

  @Get("tickets/:id")
  @ApiOperation({ summary: "Get customer support ticket details" })
  getTicket(@Req() req: any, @Param("id") id: string) {
    return this.supportService.getTicket(id, req.user.id);
  }

  @Post("tickets/:id/rate")
  @ApiOperation({ summary: "Rate a resolved support ticket" })
  @ApiBody({ type: RateTicketDto })
  rateTicket(@Req() req: any, @Param("id") id: string, @Body() body: RateTicketDto) {
    return this.supportService.rateTicket(id, req.user.id, body);
  }
}
