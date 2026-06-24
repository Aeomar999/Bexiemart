import { Injectable, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ChatService } from "../chat/chat.service";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { SYSTEM_USER_ID, TICKET_PRIORITY, TICKET_RECEIPT_MESSAGE } from "./support.constants";

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService
  ) {}

  /**
   * Creates a support ticket and its underlying SUPPORT conversation atomically
   * (REQ-001/002/003). The conversation is born with the customer as its sole
   * participant; the assigned agent is added later on claim (Phase 3). A receipt
   * message authored by the SYSTEM user is seeded so it persists in history.
   */
  async createTicket(userId: string, dto: CreateTicketDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. If an order is linked, it must belong to the requesting customer (REQ-005).
      let order: { status: string; paymentStatus: string } | null = null;
      if (dto.orderId) {
        const found = await tx.order.findUnique({
          where: { id: dto.orderId },
          select: { userId: true, status: true, paymentStatus: true },
        });
        if (!found || found.userId !== userId) {
          throw new ForbiddenException("Order not found or does not belong to you");
        }
        order = { status: found.status, paymentStatus: found.paymentStatus };
      }

      // 2. Derive priority server-side (REQ-006).
      const priority = this.derivePriority(dto.category, order);

      // 3. SUPPORT conversation, single participant (the customer).
      const conversation = await this.chatService.createSupportConversation(
        userId,
        tx,
        dto.orderId
      );

      // 4. The ticket wrapping the conversation.
      const ticket = await tx.supportTicket.create({
        data: {
          userId,
          orderId: dto.orderId ?? null,
          conversationId: conversation.id,
          category: dto.category,
          subject: dto.subject,
          priority,
        },
      });

      // 5. Seed the receipt (REQ-003). The SYSTEM user is not a participant, so we
      // write directly rather than via ChatService.createMessage (which is ACL-gated).
      await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderId: SYSTEM_USER_ID,
          content: TICKET_RECEIPT_MESSAGE,
          type: "TEXT",
        },
      });

      // 6. Optional first message from the customer.
      if (dto.content || dto.mediaUrl) {
        await tx.message.create({
          data: {
            conversationId: conversation.id,
            senderId: userId,
            content: dto.content ?? null,
            type: dto.mediaUrl ? "IMAGE" : "TEXT",
            mediaUrl: dto.mediaUrl ?? null,
          },
        });
      }

      return tx.supportTicket.findUnique({
        where: { id: ticket.id },
        include: {
          conversation: {
            include: {
              messages: { orderBy: { createdAt: "asc" } },
            },
          },
        },
      });
    });
  }

  /**
   * Narrow URGENT trigger (REQ-006): a payment/refund problem on an order that is
   * already marked delivered but whose payment failed. Everything else is NORMAL —
   * we deliberately avoid auto-elevating whole categories to keep the queue's
   * wait-time ordering meaningful.
   */
  private derivePriority(
    category: string,
    order: { status: string; paymentStatus: string } | null
  ): string {
    if (
      order &&
      category === "PAYMENT_REFUND" &&
      order.paymentStatus === "failed" &&
      order.status === "delivered"
    ) {
      return TICKET_PRIORITY.URGENT;
    }
    return TICKET_PRIORITY.NORMAL;
  }
}
