import { Controller, Get, Post, Param, Body, Query, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../../guards/auth.guard";
import { ChatService } from "./chat.service";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from "@nestjs/swagger";
import { ChatGateway } from "./chat.gateway";
import { AuthenticatedRequest } from "../../types/request.types";

@ApiTags("Chat")
@ApiBearerAuth()
@Controller("chat")
@UseGuards(AuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway
  ) {}

  @Get("presence")
  @ApiOperation({ summary: "Get online status of users" })
  getPresence(@Query("userIds") userIds: string) {
    if (!userIds) return {};
    const ids = userIds.split(",");
    const presence: Record<string, boolean> = {};
    ids.forEach((id) => {
      presence[id] = this.chatGateway.isUserOnline(id);
    });
    return presence;
  }

  @Get("conversations")
  @ApiOperation({ summary: "Get all conversations for the user" })
  getConversations(@Req() req: AuthenticatedRequest) {
    return this.chatService.getConversations(req.user.id);
  }

  @Get("conversations/:id")
  @ApiOperation({ summary: "Get a conversation by ID" })
  getConversation(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.chatService.getConversation(id, req.user.id);
  }

  @Post("conversations")
  @ApiOperation({ summary: "Create a new conversation" })
  @ApiBody({ type: CreateConversationDto })
  createConversation(@Req() req: AuthenticatedRequest, @Body() body: CreateConversationDto) {
    return this.chatService.createConversation(req.user.id, body.participantId, body.orderId);
  }

  @Post("conversations/:id/read")
  @ApiOperation({ summary: "Mark conversation as read" })
  markAsRead(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.chatService.markAsRead(id, req.user.id);
  }

  @Get("conversations/:id/messages")
  @ApiOperation({ summary: "Get messages in a conversation" })
  getMessages(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Query("page") page?: number,
    @Query("pageSize") pageSize?: number
  ) {
    return this.chatService.getMessages(id, req.user.id, page, pageSize);
  }
}
