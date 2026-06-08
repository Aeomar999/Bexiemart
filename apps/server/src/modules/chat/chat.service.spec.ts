import { ChatService } from "./chat.service";
import { NotFoundException, ForbiddenException } from "@nestjs/common";

const mockPrisma = (): any => ({
  $queryRaw: jest.fn(),
  $transaction: jest.fn((cb: any) => cb(mockPrisma())),
  wallet: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  transaction: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  product: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  cart: { findUnique: jest.fn(), create: jest.fn() },
  cartItem: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  order: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  orderItem: { findMany: jest.fn(), create: jest.fn() },
  shippingAddress: { create: jest.fn() },
  escrow: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
  user: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), count: jest.fn() },
  vendorProfile: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  referral: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn() },
  referredUser: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn() },
  conversation: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  conversationParticipant: { findMany: jest.fn(), updateMany: jest.fn() },
  message: { findMany: jest.fn(), create: jest.fn(), count: jest.fn(), groupBy: jest.fn() },
  platformConfig: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn() },
  category: { findUnique: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
});

describe("ChatService", () => {
  let service: ChatService;

  beforeEach(() => {
    const p = mockPrisma();
    p.$transaction.mockImplementation((cb: any, opts?: any) => cb(p));
    service = new ChatService(p as any);
  });

  describe("getConversations", () => {
    it("should return participant conversations with other users mapped", async () => {
      const mockParticipants = [
        {
          userId: "user1",
          conversationId: "conv1",
          conversation: {
            id: "conv1",
            orderId: "order1",
            updatedAt: new Date("2024-01-02"),
            createdAt: new Date("2024-01-01"),
            participants: [
              {
                userId: "user1",
                user: { id: "user1", name: "User1", email: "u1@test.com", image: null },
              },
              {
                userId: "user2",
                user: { id: "user2", name: "User2", email: "u2@test.com", image: null },
              },
            ],
            messages: [{ createdAt: new Date("2024-01-02"), content: "Hello" }],
          },
        },
      ];
      (service as any).prisma.message.groupBy.mockResolvedValue([]);
      (service as any).prisma.conversationParticipant.findMany.mockResolvedValue(mockParticipants);

      const result = await service.getConversations("user1");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("conv1");
      expect(result[0].participants).toHaveLength(1);
      expect(result[0].participants[0].id).toBe("user2");
      expect(result[0].lastMessage).toEqual(mockParticipants[0].conversation.messages[0]);
    });
  });

  describe("getConversation", () => {
    it("should throw NotFoundException if not found", async () => {
      (service as any).prisma.conversation.findUnique.mockResolvedValue(null);

      await expect(service.getConversation("conv1", "user1")).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException if not a participant", async () => {
      (service as any).prisma.conversation.findUnique.mockResolvedValue({
        id: "conv1",
        participants: [{ userId: "user2" }],
      });

      await expect(service.getConversation("conv1", "user1")).rejects.toThrow(ForbiddenException);
    });

    it("should return conversation with participants", async () => {
      const mockConv = {
        id: "conv1",
        orderId: "order1",
        participants: [
          {
            userId: "user1",
            user: { id: "user1", name: "User1", email: "u1@test.com", image: null },
          },
          {
            userId: "user2",
            user: { id: "user2", name: "User2", email: "u2@test.com", image: null },
          },
        ],
      };
      (service as any).prisma.conversation.findUnique.mockResolvedValue(mockConv);

      const result = await service.getConversation("conv1", "user1");

      expect(result).toEqual(mockConv);
    });
  });

  describe("getMessages", () => {
    it("should return paginated messages with total count", async () => {
      (service as any).prisma.conversation.findUnique.mockResolvedValue({
        id: "conv1",
        participants: [{ userId: "user1" }],
      });
      const messages = [
        { id: "m1", content: "Hi", createdAt: new Date("2024-01-02"), sender: { id: "user1" } },
      ];
      (service as any).prisma.message.findMany.mockResolvedValue(messages);
      (service as any).prisma.message.count.mockResolvedValue(1);

      const result = await service.getMessages("conv1", "user1", 1, 10);

      expect(result).toEqual({
        data: messages.reverse(),
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });
    });
  });

  describe("createConversation", () => {
    it("should return existing conversation if found", async () => {
      const [id1, id2] = ["user1", "user2"].sort();
      const existingConv = {
        id: "conv1",
        participants: [
          { userId: id1, user: { id: id1, name: "User1", email: "u1@test.com", image: null } },
          { userId: id2, user: { id: id2, name: "User2", email: "u2@test.com", image: null } },
        ],
      };
      (service as any).prisma.conversation.findFirst.mockResolvedValue(existingConv);

      const result = await service.createConversation("user1", "user2");

      expect(result).toEqual(existingConv);
      expect((service as any).prisma.conversation.findFirst).toHaveBeenCalledWith({
        where: {
          AND: [
            { participants: { some: { userId: id1 } } },
            { participants: { some: { userId: id2 } } },
          ],
          orderId: null,
        },
        include: expect.any(Object),
      });
    });

    it("should create new conversation with sorted participant IDs", async () => {
      (service as any).prisma.conversation.findFirst.mockResolvedValue(null);
      const newConv = {
        id: "conv2",
        participants: [
          {
            userId: "user1",
            user: { id: "user1", name: "User1", email: "u1@test.com", image: null },
          },
          {
            userId: "user2",
            user: { id: "user2", name: "User2", email: "u2@test.com", image: null },
          },
        ],
      };
      (service as any).prisma.conversation.create.mockResolvedValue(newConv);

      const result = await service.createConversation("user1", "user2");

      expect(result).toEqual(newConv);
      expect((service as any).prisma.conversation.create).toHaveBeenCalledWith({
        data: {
          orderId: undefined,
          participants: { create: [{ userId: "user1" }, { userId: "user2" }] },
        },
        include: expect.any(Object),
      });
    });
  });

  describe("markAsRead", () => {
    it("should update lastReadAt for participant", async () => {
      (service as any).prisma.conversation.findUnique.mockResolvedValue({
        id: "conv1",
        participants: [{ userId: "user1" }],
      });
      (service as any).prisma.conversationParticipant.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.markAsRead("conv1", "user1");

      expect(result).toEqual({ success: true });
      expect((service as any).prisma.conversationParticipant.updateMany).toHaveBeenCalledWith({
        where: { conversationId: "conv1", userId: "user1" },
        data: { lastReadAt: expect.any(Date) },
      });
    });
  });

  describe("createMessage", () => {
    it("should create message and update conversation updatedAt", async () => {
      (service as any).prisma.conversation.findUnique.mockResolvedValue({
        id: "conv1",
        participants: [{ userId: "user1" }],
      });
      const newMessage = {
        id: "m1",
        conversationId: "conv1",
        senderId: "user1",
        content: "Hello",
        sender: { id: "user1", name: "User1", email: "u1@test.com", image: null },
      };
      (service as any).prisma.message.create.mockResolvedValue(newMessage);
      (service as any).prisma.conversation.update.mockResolvedValue({
        id: "conv1",
        updatedAt: new Date(),
      });

      const result = await service.createMessage("conv1", "user1", "Hello");

      expect(result).toEqual(newMessage);
      expect((service as any).prisma.message.create).toHaveBeenCalledWith({
        data: {
          conversationId: "conv1",
          senderId: "user1",
          content: "Hello",
          type: "TEXT",
          mediaUrl: undefined,
        },
        include: expect.any(Object),
      });
      expect((service as any).prisma.conversation.update).toHaveBeenCalledWith({
        where: { id: "conv1" },
        data: { updatedAt: expect.any(Date) },
      });
    });
  });
});
