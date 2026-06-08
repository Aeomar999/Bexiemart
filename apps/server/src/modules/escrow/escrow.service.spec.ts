import { NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { EscrowService } from "./escrow.service";

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
  message: { findMany: jest.fn(), create: jest.fn(), count: jest.fn() },
  platformConfig: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn() },
  category: { findUnique: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
});

describe("EscrowService", () => {
  let service: EscrowService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma();
    prisma.$transaction.mockImplementation((cb: any, opts?: any) => cb(prisma));
    prisma.wallet.findUnique.mockResolvedValue(null);
    prisma.vendorProfile.findUnique.mockResolvedValue(null);
    service = new EscrowService(prisma as any);
  });

  describe("list", () => {
    it("returns merged buyer and vendor escrows with no duplicates", async () => {
      prisma.wallet.findUnique.mockResolvedValue({ id: "w1", userId: "u1" });
      prisma.vendorProfile.findUnique.mockResolvedValue({ id: "vp1", userId: "u1" });

      const buyerEscrows = [
        { id: "e1", order: {}, vendor: {} },
        { id: "e2", order: {}, vendor: {} },
      ];
      const vendorEscrows = [
        { id: "e2", order: {}, vendor: {} },
        { id: "e3", order: {}, vendor: {} },
      ];

      prisma.escrow.findMany
        .mockResolvedValueOnce(buyerEscrows)
        .mockResolvedValueOnce(vendorEscrows);

      const result = await service.list("u1");
      expect(result).toHaveLength(3);
      expect(result.map((e: any) => e.id)).toEqual(["e1", "e2", "e3"]);
    });
  });

  describe("get", () => {
    it("throws NotFoundException if escrow not found", async () => {
      prisma.escrow.findUnique.mockResolvedValue(null);
      await expect(service.get("u1", "e1")).rejects.toThrow(NotFoundException);
    });
  });

  describe("dispute", () => {
    it("throws BadRequestException if escrow is not in HELD status", async () => {
      prisma.escrow.findUnique.mockResolvedValue({ id: "e1", status: "RELEASED" });
      await expect(service.dispute("u1", "e1", "reason")).rejects.toThrow(BadRequestException);
    });

    it("updates escrow status to DISPUTED", async () => {
      const escrow = { id: "e1", status: "HELD", buyerWalletId: "w1" };
      prisma.escrow.findUnique.mockResolvedValue(escrow);
      prisma.wallet.findUnique.mockResolvedValue({ id: "w1", userId: "u1" });
      prisma.vendorProfile.findUnique.mockResolvedValue(null);
      prisma.escrow.update.mockResolvedValue({ ...escrow, status: "DISPUTED", reason: "test" });

      const result = await service.dispute("u1", "e1", "test");
      expect(result!.status).toBe("DISPUTED");
      expect(prisma.escrow.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "DISPUTED", reason: "test" }),
        })
      );
    });
  });

  describe("release", () => {
    it("throws BadRequestException if escrow is not in HELD status", async () => {
      prisma.escrow.findUnique.mockResolvedValue({ id: "e1", status: "DISPUTED", vendor: {} });
      await expect(service.release("u1", "e1")).rejects.toThrow(BadRequestException);
    });

    it("throws ForbiddenException if caller is not the vendor", async () => {
      prisma.escrow.findUnique.mockResolvedValue({
        id: "e1",
        status: "HELD",
        vendor: { userId: "other-vendor" },
      });
      await expect(service.release("buyer-user", "e1")).rejects.toThrow(ForbiddenException);
    });

    it("creates EARNINGS transaction, increments wallet, and updates status to RELEASED", async () => {
      const escrowData = {
        id: "e1",
        status: "HELD",
        amount: 100,
        commission: 10,
        netAmount: 90,
        orderId: "o1",
        buyerWalletId: "bw1",
        vendorWalletId: null,
        vendor: { userId: "vendor-user" },
      };
      const vendorWallet = { id: "vw1", userId: "vendor-user", currency: "NGN" };
      const txn = { id: "txn1" };

      prisma.escrow.findUnique
        .mockResolvedValueOnce(escrowData)
        .mockResolvedValue({ ...escrowData, status: "RELEASED" });
      prisma.wallet.findUnique.mockResolvedValue(vendorWallet);
      prisma.transaction.create.mockResolvedValue(txn);
      prisma.wallet.update.mockResolvedValue({});
      prisma.escrow.update
        .mockResolvedValueOnce({}) // pre-$transaction update to set vendorWalletId
        .mockResolvedValueOnce({
          ...escrowData,
          status: "RELEASED",
          releasedTxnId: "txn1",
          vendorWalletId: "vw1",
        });

      const result = await service.release("vendor-user", "e1");
      expect(result!.status).toBe("RELEASED");
      expect(prisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: "EARNINGS", walletId: "vw1" }),
        })
      );
      expect(prisma.wallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "vw1" },
          data: expect.objectContaining({ balance: { increment: 90 } }),
        })
      );
    });
  });

  describe("refund", () => {
    it("throws BadRequestException if escrow is not in HELD status", async () => {
      prisma.escrow.findUnique.mockResolvedValue({ id: "e1", status: "RELEASED" });
      await expect(service.refund("u1", "e1")).rejects.toThrow(BadRequestException);
    });

    it("throws ForbiddenException if caller is not the buyer", async () => {
      prisma.escrow.findUnique.mockResolvedValue({
        id: "e1",
        status: "HELD",
        buyerWalletId: "bw1",
      });
      prisma.wallet.findUnique.mockResolvedValue({ id: "bw2", userId: "other-user" });
      await expect(service.refund("other-user", "e1")).rejects.toThrow(ForbiddenException);
    });

    it("creates REVERSAL transaction, refunds buyer, and updates status to REFUNDED", async () => {
      const escrowData = {
        id: "e1",
        status: "HELD",
        amount: 100,
        commission: 10,
        netAmount: 90,
        orderId: "o1",
        buyerWalletId: "bw1",
        vendorWalletId: "vw1",
      };
      const buyerWallet = { id: "bw1", userId: "buyer-user" };
      const txn = { id: "txn1" };

      prisma.escrow.findUnique
        .mockResolvedValueOnce(escrowData)
        .mockResolvedValue({ ...escrowData, status: "REFUNDED" });
      prisma.wallet.findUnique.mockResolvedValue(buyerWallet);
      prisma.transaction.create.mockResolvedValue(txn);
      prisma.wallet.update.mockResolvedValue({});
      prisma.escrow.update.mockResolvedValue({
        ...escrowData,
        status: "REFUNDED",
        releasedTxnId: "txn1",
      });

      const result = await service.refund("buyer-user", "e1");
      expect(result!.status).toBe("REFUNDED");
      expect(prisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: "REVERSAL", walletId: "bw1" }),
        })
      );
      expect(prisma.wallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "bw1" },
          data: expect.objectContaining({ balance: { increment: 100 } }),
        })
      );
    });
  });
});
