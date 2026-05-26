import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async getConversations(userId: string) {
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: {
              include: { user: { select: { id: true, name: true, email: true, image: true } } },
            },
            messages: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
      },
      orderBy: { conversation: { updatedAt: "desc" } },
    });

    return participants.map((p) => {
      const conv = p.conversation;
      const otherParticipants = conv.participants.filter((cp) => cp.userId !== userId);
      return {
        id: conv.id,
        orderId: conv.orderId,
        participants: otherParticipants.map((cp) => cp.user),
        lastMessage: conv.messages[0] || null,
        unreadCount: 0,
        updatedAt: conv.updatedAt,
        createdAt: conv.createdAt,
      };
    });
  }

  async getConversation(id: string, userId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
      },
    });
    if (!conv) throw new NotFoundException("Conversation not found");
    const isParticipant = conv.participants.some((p) => p.userId === userId);
    if (!isParticipant) throw new ForbiddenException("Not a participant");
    return conv;
  }

  async getMessages(conversationId: string, userId: string, page = 1, pageSize = 50) {
    await this.getConversation(conversationId, userId);
    const skip = (page - 1) * pageSize;
    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        include: { sender: { select: { id: true, name: true, email: true, image: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);
    return { data: messages.reverse(), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async createConversation(userId: string, participantId: string, orderId?: string) {
    const [id1, id2] = [userId, participantId].sort();
    const existing = await this.prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: id1 } } },
          { participants: { some: { userId: id2 } } },
        ],
        orderId: orderId ?? null,
      },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
      },
    });
    if (existing) return existing;

    return this.prisma.conversation.create({
      data: {
        orderId,
        participants: {
          create: [{ userId: id1 }, { userId: id2 }],
        },
      },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
      },
    });
  }

  async markAsRead(conversationId: string, userId: string) {
    await this.getConversation(conversationId, userId);
    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId, userId },
      data: { lastReadAt: new Date() },
    });
    return { success: true };
  }

  async createMessage(conversationId: string, senderId: string, content: string) {
    const conv = await this.getConversation(conversationId, senderId);
    const message = await this.prisma.message.create({
      data: { conversationId, senderId, content },
      include: { sender: { select: { id: true, name: true, email: true, image: true } } },
    });
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    return message;
  }
}
