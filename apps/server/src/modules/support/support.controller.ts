import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { SupportService } from "./support.service";
import { CreateTicketDto } from "./dto/create-ticket.dto";

@ApiTags("Support")
@ApiBearerAuth()
@Controller("support")
@UseGuards(AuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get("admin/tickets")
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: "List support tickets for admins" })
  getAdminTickets(@Req() req: any) {
    return this.supportService.getAdminQueue();
  }

  @Get("admin/tickets/:id")
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: "Get a support ticket with conversation history for admins" })
  getAdminTicket(@Req() req: any, @Param("id") id: string) {
    return this.supportService.getTicketForAdmin(id, req.user.id);
  }

  @Get("admin/disputes/:escrowId/ticket")
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: "Get the support ticket linked to a dispute for admins" })
  getAdminDisputeTicket(@Req() req: any, @Param("escrowId") escrowId: string) {
    return this.supportService.getDisputeTicketForAdmin(escrowId, req.user.id);
  }

  @Post("admin/disputes/:escrowId/ticket")
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: "Create or return the support ticket linked to a dispute for admins" })
  ensureAdminDisputeTicket(@Req() req: any, @Param("escrowId") escrowId: string) {
    return this.supportService.ensureDisputeTicketForAdmin(escrowId, req.user.id);
  }

  @Post("admin/tickets/:id/messages")
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: "Send a message on behalf of an admin" })
  sendAdminMessage(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: { content?: string; type?: "TEXT" | "IMAGE"; mediaUrl?: string }
  ) {
    return this.supportService.sendMessage(id, req.user.id, body);
  }

  @Post("tickets")
  @ApiOperation({ summary: "Create a support ticket (+ underlying conversation)" })
  @ApiBody({ type: CreateTicketDto })
  createTicket(@Req() req: any, @Body() body: CreateTicketDto) {
    return this.supportService.createTicket(req.user.id, body);
  }
}
