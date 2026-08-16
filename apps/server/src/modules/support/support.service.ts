import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ChatService } from "../chat/chat.service";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { SYSTEM_USER_ID, TICKET_PRIORITY, TICKET_RECEIPT_MESSAGE } from "./support.constants";

const TICKET_DETAIL_INCLUDE = {
  user: { select: { id: true, name: true, email: true, image: true } },
  agent: { select: { id: true, name: true, email: true, image: true } },
  conversation: {
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
      messages: {
        orderBy: { createdAt: "asc" as const },
        include: { sender: { select: { id: true, name: true, email: true, image: true } } },
      },
    },
  },
} as const;

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
  async getAdminQueue() {
    const tickets = await this.prisma.supportTicket.findMany({
      where: {
        status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] },
      },
      orderBy: [{ createdAt: "asc" }],
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        conversation: { select: { id: true, updatedAt: true } },
      },
    });

    return tickets.sort((a, b) => {
      const rank = (priority: string) => ({ LOW: 0, NORMAL: 1, HIGH: 2, URGENT: 3 }[priority] ?? 1);
      return rank(b.priority) - rank(a.priority) || a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  async getTicketForAdmin(ticketId: string, adminId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: TICKET_DETAIL_INCLUDE,
    });

    if (!ticket) {
      throw new NotFoundException("Support ticket not found");
    }

    await this.chatService.ensureConversationParticipant(ticket.conversationId, adminId);

    return ticket;
  }

  async getDisputeTicketForAdmin(escrowId: string, adminId: string) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId },
      select: { id: true, orderId: true },
    });

    if (!escrow) {
      throw new NotFoundException("Escrow not found");
    }

    const ticket = await this.findDisputeTicket(escrow.id, escrow.orderId);
    if (!ticket) return null;

    await this.chatService.ensureConversationParticipant(ticket.conversationId, adminId);
    return ticket;
  }

  async ensureDisputeTicketForAdmin(escrowId: string, adminId: string) {
    const existing = await this.getDisputeTicketForAdmin(escrowId, adminId);
    if (existing) return existing;

    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            userId: true,
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        vendor: { select: { shopName: true } },
      },
    });

    if (!escrow) {
      throw new NotFoundException("Escrow not found");
    }

    const subject = this.buildDisputeSubject(escrow.id);

    const ticket = await this.prisma.$transaction(async (tx) => {
      const conversation = await this.chatService.createSupportConversation(
        escrow.order.userId,
        tx,
        escrow.orderId
      );

      const createdTicket = await tx.supportTicket.create({
        data: {
          userId: escrow.order.userId,
          orderId: escrow.orderId,
          conversationId: conversation.id,
          category: "PAYMENT_REFUND",
          subject,
          priority: TICKET_PRIORITY.HIGH,
          status: "IN_PROGRESS",
          agentId: adminId,
        },
      });

      await this.chatService.ensureConversationParticipant(conversation.id, adminId, tx);

      await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderId: SYSTEM_USER_ID,
          content: this.buildDisputeIntroMessage(escrow),
          type: "TEXT",
        },
      });

      return tx.supportTicket.findUnique({
        where: { id: createdTicket.id },
        include: TICKET_DETAIL_INCLUDE,
      });
    });

    return ticket;
  }

  async sendMessage(ticketId: string, adminId: string, payload: { content?: string; type?: "TEXT" | "IMAGE"; mediaUrl?: string }) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, conversationId: true, status: true },
    });

    if (!ticket) {
      throw new NotFoundException("Support ticket not found");
    }

    await this.chatService.ensureConversationParticipant(ticket.conversationId, adminId);
    const message = await this.chatService.createMessage(
      ticket.conversationId,
      adminId,
      payload.content,
      payload.type ?? "TEXT",
      payload.mediaUrl
    );

    if (ticket.status === "OPEN") {
      await this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: "IN_PROGRESS" },
      });
    }

    return { ticketId, message };
  }

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

  private findDisputeTicket(escrowId: string, orderId: string) {
    return this.prisma.supportTicket.findFirst({
      where: {
        orderId,
        subject: this.buildDisputeSubject(escrowId),
      },
      include: TICKET_DETAIL_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
  }

  private buildDisputeSubject(escrowId: string) {
    return `Dispute ${escrowId}`;
  }

  private buildDisputeIntroMessage(escrow: {
    id: string;
    orderId: string;
    reason?: string | null;
    vendor?: { shopName?: string | null } | null;
    order: { orderNumber?: string | null };
  }) {
    const orderLabel = escrow.order.orderNumber || escrow.orderId;
    const vendor = escrow.vendor?.shopName ? ` Vendor: ${escrow.vendor.shopName}.` : "";
    const reason = escrow.reason ? ` Reason: ${escrow.reason}` : "";

    return `Support chat opened for dispute ${escrow.id} on order ${orderLabel}.${vendor}${reason}`;
  }
}
