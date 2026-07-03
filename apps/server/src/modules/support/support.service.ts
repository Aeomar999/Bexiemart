import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ChatService } from "../chat/chat.service";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { RateTicketDto } from "./dto/rate-ticket.dto";
import {
  SYSTEM_USER_ID,
  TICKET_PRIORITY,
  TICKET_RECEIPT_MESSAGE,
  TICKET_STATUS,
} from "./support.constants";
import { AdminGateway } from "../admin/admin.gateway";

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
    private readonly adminGateway: AdminGateway
  ) {}

  /**
   * Creates a support ticket and its underlying SUPPORT conversation atomically
   * (REQ-001/002/003). The conversation is born with the customer as its sole
   * participant; the assigned agent is added later on claim (Phase 3). A receipt
   * message authored by the SYSTEM user is seeded so it persists in history.
   */
  async createTicket(userId: string, dto: CreateTicketDto) {
    const res = await this.prisma.$transaction(async (tx) => {
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

      const created = await tx.supportTicket.findUnique({
        where: { id: ticket.id },
        include: {
          conversation: {
            include: {
              messages: { orderBy: { createdAt: "asc" } },
            },
          },
        },
      });

      return created;
    });

    if (res) {
      this.adminGateway.emitTicketCreated({
        ticketId: res.id,
        category: res.category,
        subject: res.subject,
        priority: res.priority,
      });
    }

    return res;
  }

  /**
   * Returns paginated support tickets for a customer, ordered by most recently
   * updated. Each ticket includes the conversation's last message for preview.
   */
  async listMyTickets(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
        include: {
          conversation: {
            include: {
              messages: {
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
      }),
      this.prisma.supportTicket.count({ where: { userId } }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Returns a single ticket with its full conversation messages (latest 50).
   * Access is restricted to the ticket owner or the assigned agent.
   */
  async getTicket(ticketId: string, userId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: "desc" },
              take: 50,
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException("Support ticket not found");
    }

    if (ticket.userId !== userId && ticket.agentId !== userId) {
      throw new ForbiddenException("You do not have access to this ticket");
    }

    return ticket;
  }

  /**
   * Allows the ticket owner to rate a resolved or closed ticket (1-5 stars).
   * Only the customer who opened the ticket may rate it, and only after it
   * has been resolved or closed by the support agent.
   */
  async rateTicket(ticketId: string, userId: string, dto: RateTicketDto) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { userId: true, status: true },
    });

    if (!ticket) {
      throw new NotFoundException("Support ticket not found");
    }

    if (ticket.userId !== userId) {
      throw new ForbiddenException("Only the ticket owner can rate this ticket");
    }

    const ratableStatuses: string[] = [TICKET_STATUS.RESOLVED, TICKET_STATUS.CLOSED];
    if (!ratableStatuses.includes(ticket.status)) {
      throw new BadRequestException("Only resolved or closed tickets can be rated");
    }

    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        rating: dto.rating,
        ratingComment: dto.comment ?? null,
      },
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
