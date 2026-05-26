import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { UnauthorizedException } from "@nestjs/common";
import { auth } from "../../auth/better-auth";
import { ChatService } from "./chat.service";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({ namespace: "/chat" })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        client.emit("error", "Missing authentication token");
        client.disconnect();
        return;
      }
      const headers = new Headers();
      headers.set("cookie", `better-auth.session_token=${token}`);
      const session = await auth.api.getSession({ headers });
      if (!session?.user) {
        client.emit("error", "Invalid session");
        client.disconnect();
        return;
      }
      client.userId = session.user.id;
      client.join(`user:${session.user.id}`);
    } catch {
      client.emit("error", "Authentication failed");
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
  }

  @SubscribeMessage("join_conversation")
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!client.userId) return;
    client.join(`conversation:${data.conversationId}`);
  }

  @SubscribeMessage("leave_conversation")
  async handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!client.userId) return;
    client.leave(`conversation:${data.conversationId}`);
  }

  @SubscribeMessage("send_message")
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    if (!client.userId) return;
    const message = await this.chatService.createMessage(
      data.conversationId,
      client.userId,
      data.content,
    );
    this.server.to(`conversation:${data.conversationId}`).emit("new_message", message);
    return message;
  }

  @SubscribeMessage("typing")
  async handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    if (!client.userId) return;
    client.to(`conversation:${data.conversationId}`).emit("typing", {
      conversationId: data.conversationId,
      userId: client.userId,
      isTyping: data.isTyping,
    });
  }
}
