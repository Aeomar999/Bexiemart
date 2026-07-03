import { ForbiddenException } from "@nestjs/common";
import { SupportService } from "./support.service";
import { ChatService } from "../chat/chat.service";
import { SYSTEM_USER_ID, TICKET_RECEIPT_MESSAGE } from "./support.constants";

/**
 * Self-contained mock: `$transaction` runs the callback against a single,
 * controllable tx client so we can program and assert on its calls (the shared
 * prisma.mock spawns a fresh client per transaction, which we can't inspect).
 */
function makeMocks() {
  const tx: any = {
    order: { findUnique: jest.fn() },
    conversation: { create: jest.fn().mockResolvedValue({ id: "conv-1" }) },
    supportTicket: {
      create: jest.fn().mockResolvedValue({ id: "ticket-1" }),
      findUnique: jest.fn().mockResolvedValue({ id: "ticket-1", conversationId: "conv-1" }),
    },
    message: { create: jest.fn().mockResolvedValue({ id: "msg-1" }) },
  };
  const prisma: any = { $transaction: jest.fn((cb: any) => cb(tx)) };
  const chatService = new ChatService(prisma);
  const adminGateway: any = { emitTicketCreated: jest.fn() };
  const service = new SupportService(prisma, chatService, adminGateway);
  return { service, prisma, tx, adminGateway };
}

const CUSTOMER = "user-1";

describe("SupportService.createTicket", () => {
  it("creates a SUPPORT conversation with a single participant + ticket + seeded receipt", async () => {
    const { service, tx } = makeMocks();

    await service.createTicket(CUSTOMER, {
      category: "ORDER_ISSUE",
      subject: "Where is my order?",
    });

    // SUPPORT conversation, customer-only participant.
    expect(tx.conversation.create).toHaveBeenCalledWith({
      data: {
        type: "SUPPORT",
        orderId: null,
        participants: { create: [{ userId: CUSTOMER }] },
      },
    });

    // Ticket wraps the conversation.
    expect(tx.supportTicket.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: CUSTOMER,
        conversationId: "conv-1",
        category: "ORDER_ISSUE",
        subject: "Where is my order?",
        priority: "NORMAL",
      }),
    });
  });

  it("seeds the receipt message authored by the SYSTEM user", async () => {
    const { service, tx } = makeMocks();

    await service.createTicket(CUSTOMER, {
      category: "OTHER",
      subject: "General question",
    });

    expect(tx.message.create).toHaveBeenCalledWith({
      data: {
        conversationId: "conv-1",
        senderId: SYSTEM_USER_ID,
        content: TICKET_RECEIPT_MESSAGE,
        type: "TEXT",
      },
    });
  });

  it("rejects linking an order that does not belong to the customer, creating nothing", async () => {
    const { service, tx } = makeMocks();
    tx.order.findUnique.mockResolvedValue({
      userId: "someone-else",
      status: "pending",
      paymentStatus: "pending",
    });

    await expect(
      service.createTicket(CUSTOMER, {
        category: "ORDER_ISSUE",
        subject: "Refund please",
        orderId: "order-x",
      })
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(tx.conversation.create).not.toHaveBeenCalled();
    expect(tx.supportTicket.create).not.toHaveBeenCalled();
    expect(tx.message.create).not.toHaveBeenCalled();
  });

  it("derives URGENT for a failed payment on a delivered order (PAYMENT_REFUND)", async () => {
    const { service, tx } = makeMocks();
    tx.order.findUnique.mockResolvedValue({
      userId: CUSTOMER,
      status: "delivered",
      paymentStatus: "failed",
    });

    await service.createTicket(CUSTOMER, {
      category: "PAYMENT_REFUND",
      subject: "Paid but no refund",
      orderId: "order-1",
    });

    expect(tx.supportTicket.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ priority: "URGENT", orderId: "order-1" }),
    });
  });

  it("writes an optional first customer message when content is provided", async () => {
    const { service, tx } = makeMocks();

    await service.createTicket(CUSTOMER, {
      category: "PRODUCT",
      subject: "Damaged item",
      content: "The box arrived crushed",
    });

    // Receipt (SYSTEM) + customer's first message.
    expect(tx.message.create).toHaveBeenCalledTimes(2);
    expect(tx.message.create).toHaveBeenLastCalledWith({
      data: {
        conversationId: "conv-1",
        senderId: CUSTOMER,
        content: "The box arrived crushed",
        type: "TEXT",
        mediaUrl: null,
      },
    });
  });
});
