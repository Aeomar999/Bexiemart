import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger, Inject } from "@nestjs/common";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { AUTH } from "../../auth/auth.constants";
import { ChatService } from "./chat.service";
import {
  WsPresenceSubscriptionDto,
  WsConversationJoinDto,
  WsSendMessageDto,
  WsTypingDto,
  WsMessageReadDto,
} from "./dto/ws-message.dto";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({ namespace: "/chat" })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger("ChatGateway");

  private userSockets = new Map<string, Set<string>>();

  private messageRateLimits = new Map<string, number[]>();

  constructor(
    private readonly chatService: ChatService,
    @Inject(AUTH) private readonly auth: any
  ) {}

  private async validateWs<T extends object>(dtoClass: new () => T, data: unknown): Promise<T> {
    if (!data || typeof data !== "object") {
      throw new WsException("Invalid message payload");
    }
    const dto = plainToInstance(dtoClass, data, {
      enableImplicitConversion: true,
    });
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length > 0) {
      const messages = errors
        .map((err) => Object.values(err.constraints || {}))
        .flat()
        .join("; ");
      throw new WsException(`Validation failed: ${messages}`);
    }
    return dto;
  }

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
      const session = await this.auth.api.getSession({ headers });
      if (!session?.user) {
        client.emit("error", "Invalid session");
        client.disconnect();
        return;
      }
      const userId = session.user.id;
      client.userId = userId;
      client.join(`user:${userId}`);

      // Presence tracking
      let sockets = this.userSockets.get(userId);
      if (!sockets) {
        sockets = new Set();
        this.userSockets.set(userId, sockets);
      }
      sockets.add(client.id);

      if (sockets.size === 1) {
        // User just came online
        this.server.to(`presence:${userId}`).emit("presence_update", { userId, isOnline: true });
      }
    } catch {
      client.emit("error", "Authentication failed");
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const sockets = this.userSockets.get(client.userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(client.userId);
          // User went offline
          this.server
            .to(`presence:${client.userId}`)
            .emit("presence_update", { userId: client.userId, isOnline: false });
        }
      }
    }
  }

  // Get current online status immediately (helpful for REST fallback too)
  isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return sockets ? sockets.size > 0 : false;
  }

  @SubscribeMessage("subscribe_presence")
  async handleSubscribePresence(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: unknown
  ) {
    if (!client.userId) return;
    const dto = await this.validateWs(WsPresenceSubscriptionDto, data);

    dto.userIds.forEach((id) => {
      client.join(`presence:${id}`);
      client.emit("presence_update", { userId: id, isOnline: this.isUserOnline(id) });
    });
  }

  @SubscribeMessage("unsubscribe_presence")
  async handleUnsubscribePresence(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: unknown
  ) {
    if (!client.userId) return;
    const dto = await this.validateWs(WsPresenceSubscriptionDto, data);
    dto.userIds.forEach((id) => {
      client.leave(`presence:${id}`);
    });
  }

  @SubscribeMessage("join_conversation")
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: unknown
  ) {
    if (!client.userId) return;
    const dto = await this.validateWs(WsConversationJoinDto, data);
    client.join(`conversation:${dto.conversationId}`);
  }

  @SubscribeMessage("leave_conversation")
  async handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: unknown
  ) {
    if (!client.userId) return;
    const dto = await this.validateWs(WsConversationJoinDto, data);
    client.leave(`conversation:${dto.conversationId}`);
  }

  @SubscribeMessage("send_message")
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: unknown
  ) {
    if (!client.userId) return;
    const dto = await this.validateWs(WsSendMessageDto, data);

    if (!dto.content && !dto.mediaUrl) {
      client.emit("error", "Message must have content or mediaUrl");
      return;
    }

    const now = Date.now();
    const window = 60000;
    const limit = 30;
    let timestamps = this.messageRateLimits.get(client.userId) || [];
    timestamps = timestamps.filter((t) => now - t < window);
    if (timestamps.length >= limit) {
      client.emit("error", "Rate limit exceeded. Please wait.");
      return;
    }
    timestamps.push(now);
    this.messageRateLimits.set(client.userId, timestamps);

    const message = await this.chatService.createMessage(
      dto.conversationId,
      client.userId,
      dto.content,
      dto.type,
      dto.mediaUrl
    );
    this.server.to(`conversation:${dto.conversationId}`).emit("new_message", message);

    const conv = await this.chatService.getConversation(dto.conversationId, client.userId);
    conv.participants.forEach((p) => {
      if (p.userId !== client.userId) {
        this.server.to(`user:${p.userId}`).emit("message_notification", {
          conversationId: dto.conversationId,
          message,
        });
      }
    });

    return message;
  }

  @SubscribeMessage("message_read")
  async handleMessageRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: unknown
  ) {
    if (!client.userId) return;
    const dto = await this.validateWs(WsMessageReadDto, data);
    await this.chatService.markAsRead(dto.conversationId, client.userId);
    this.server.to(`conversation:${dto.conversationId}`).emit("read_receipt", {
      conversationId: dto.conversationId,
      userId: client.userId,
      readAt: new Date(),
    });
  }

  @SubscribeMessage("typing")
  async handleTyping(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: unknown) {
    if (!client.userId) return;
    const dto = await this.validateWs(WsTypingDto, data);
    client.to(`conversation:${dto.conversationId}`).emit("typing", {
      conversationId: dto.conversationId,
      userId: client.userId,
      isTyping: dto.isTyping,
    });
  }
}
