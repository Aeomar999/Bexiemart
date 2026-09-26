import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
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
    updateMany: jest.fn(),
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
    updateMany: jest.fn(),
  },
  orderItem: { findMany: jest.fn(), create: jest.fn() },
  shippingAddress: { create: jest.fn() },
  escrow: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
  },
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
  deliveryJob: { findFirst: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
});

describe("EscrowService", () => {
  let service: EscrowService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma();
    prisma.$transaction.mockImplementation((cb: any, opts?: any) => cb(prisma));
    prisma.wallet.findUnique.mockResolvedValue(null);
    prisma.vendorProfile.findUnique.mockResolvedValue(null);
    prisma.deliveryJob.findFirst.mockResolvedValue(null);
    prisma.escrow.findUnique.mockResolvedValue(null);
    prisma.escrow.updateMany.mockResolvedValue({ count: 1 });
    prisma.escrow.update.mockResolvedValue({});
    prisma.escrow.findFirst.mockResolvedValue(null);
    prisma.transaction.create.mockResolvedValue({ id: "txn1" });
    prisma.wallet.update.mockResolvedValue({});
    prisma.order.findUnique.mockResolvedValue(null);
    service = new EscrowService(prisma as any, { emitDisputeCreated: jest.fn() } as any);
  });

  const baseEscrow = {
    id: "e1",
    status: "HELD",
    amount: 100,
    commission: 10,
    netAmount: 90,
    orderId: "o1",
    buyerWalletId: "bw1",
    vendorWalletId: null,
    vendor: { userId: "vendor-user", id: "vp1" },
    order: {
      id: "o1",
      status: "delivered",
      updatedAt: new Date(),
    },
  };

  const resetMocks = () => {
    jest.clearAllMocks();
    prisma.wallet.findUnique.mockResolvedValue(null);
    prisma.vendorProfile.findUnique.mockResolvedValue(null);
    prisma.deliveryJob.findFirst.mockResolvedValue(null);
    prisma.escrow.findUnique.mockResolvedValue(null);
    prisma.escrow.updateMany.mockResolvedValue({ count: 1 });
    prisma.escrow.update.mockResolvedValue({});
    prisma.transaction.create.mockResolvedValue({ id: "txn1" });
    prisma.wallet.update.mockResolvedValue({});
    prisma.order.findUnique.mockResolvedValue(null);
  };

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

  describe("release (public endpoint)", () => {
    it("throws BadRequestException if escrow is not in HELD status", async () => {
      prisma.escrow.findUnique.mockResolvedValue({
        id: "e1",
        status: "DISPUTED",
        vendor: { userId: "vendor-user" },
      });
      await expect(service.release("u1", "e1")).rejects.toThrow(BadRequestException);
    });

    it("throws ForbiddenException if caller is not the vendor", async () => {
      prisma.escrow.findUnique.mockResolvedValue({
        id: "e1",
        status: "HELD",
        vendor: { userId: "other-vendor" },
        order: { status: "delivered", updatedAt: new Date() },
      });
      await expect(service.release("buyer-user", "e1")).rejects.toThrow(ForbiddenException);
    });

    it("throws BadRequestException if order is not delivered", async () => {
      prisma.escrow.findUnique.mockResolvedValue({
        ...baseEscrow,
        order: { ...baseEscrow.order, status: "shipped" },
      });
      await expect(service.release("vendor-user", "e1")).rejects.toThrow(BadRequestException);
    });

    it("throws BadRequestException if order delivered but not confirmed and auto-release window not passed", async () => {
      const recentDelivered = { ...baseEscrow };
      recentDelivered.order.updatedAt = new Date(Date.now() - 10 * 60 * 60 * 1000); // 10 hours ago

      prisma.escrow.findUnique.mockResolvedValue(recentDelivered);
      prisma.deliveryJob.findFirst.mockResolvedValue(null); // no confirmation

      await expect(service.release("vendor-user", "e1")).rejects.toThrow(BadRequestException);
    });

    it("allows release when order is delivered and buyer confirmed (deliveryJob exists)", async () => {
      const escrowData = { ...baseEscrow };
      const vendorWallet = { id: "vw1", userId: "vendor-user", currency: "GHS" };
      const txn = { id: "txn1" };

      prisma.escrow.findUnique
        .mockResolvedValueOnce(escrowData)
        .mockResolvedValueOnce({ ...escrowData, status: "RELEASED" });
      prisma.deliveryJob.findFirst.mockResolvedValue({ id: "dj1" }); // buyer confirmed
      prisma.wallet.findUnique.mockResolvedValue(vendorWallet);
      prisma.transaction.create.mockResolvedValue(txn);
      prisma.wallet.update.mockResolvedValue({});
      prisma.escrow.update.mockResolvedValue({
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
    });

    it("allows release when auto-release window (72h) passed after delivered", async () => {
      const escrowData = { ...baseEscrow };
      escrowData.order.updatedAt = new Date(Date.now() - 80 * 60 * 60 * 1000); // 80 hours ago
      const vendorWallet = { id: "vw1", userId: "vendor-user", currency: "GHS" };
      const txn = { id: "txn1" };

      prisma.escrow.findUnique
        .mockResolvedValueOnce(escrowData)
        .mockResolvedValueOnce({ ...escrowData, status: "RELEASED" });
      prisma.deliveryJob.findFirst.mockResolvedValue(null); // no confirmation
      prisma.wallet.findUnique.mockResolvedValue(vendorWallet);
      prisma.transaction.create.mockResolvedValue(txn);
      prisma.wallet.update.mockResolvedValue({});
      prisma.escrow.update.mockResolvedValue({
        ...escrowData,
        status: "RELEASED",
        releasedTxnId: "txn1",
        vendorWalletId: "vw1",
      });

      const result = await service.release("vendor-user", "e1");
      expect(result!.status).toBe("RELEASED");
    });

    it("uses atomic claim pattern - second call throws ConflictException", async () => {
      const escrowData = { ...baseEscrow };
      const vendorWallet = { id: "vw1", userId: "vendor-user", currency: "GHS" };
      const txn = { id: "txn1" };

      prisma.escrow.findUnique.mockResolvedValue(escrowData);
      prisma.deliveryJob.findFirst.mockResolvedValue({ id: "dj1" });
      prisma.wallet.findUnique.mockResolvedValue(vendorWallet);
      prisma.transaction.create.mockResolvedValue(txn);
      prisma.wallet.update.mockResolvedValue({});
      // First call succeeds, second call fails claim
      prisma.escrow.updateMany
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 0 });

      await service.release("vendor-user", "e1");
      await expect(service.release("vendor-user", "e1")).rejects.toThrow(ConflictException);
    });
  });

  describe("refund (public endpoint)", () => {
    it("throws BadRequestException if escrow is not in HELD status", async () => {
      prisma.escrow.findUnique.mockResolvedValue({ id: "e1", status: "RELEASED" });
      await expect(service.refund("u1", "e1")).rejects.toThrow(BadRequestException);
    });

    it("throws ForbiddenException if caller is not the buyer", async () => {
      prisma.escrow.findUnique.mockResolvedValue({
        id: "e1",
        status: "HELD",
        buyerWalletId: "bw1",
        order: { status: "cancelled", updatedAt: new Date() },
      });
      prisma.wallet.findUnique.mockResolvedValue({ id: "bw2", userId: "other-user" });
      await expect(service.refund("other-user", "e1")).rejects.toThrow(ForbiddenException);
    });

    it("throws BadRequestException if order status not allowed for refund", async () => {
      const escrowData = {
        ...baseEscrow,
        order: { ...baseEscrow.order, status: "shipped" },
      };
      prisma.escrow.findUnique.mockResolvedValue(escrowData);
      prisma.wallet.findUnique.mockResolvedValue({ id: "bw1", userId: "buyer-user" });

      await expect(service.refund("buyer-user", "e1")).rejects.toThrow(BadRequestException);
    });

    it("allows refund when order is cancelled", async () => {
      const escrowData = {
        ...baseEscrow,
        order: { ...baseEscrow.order, status: "cancelled", updatedAt: new Date() },
      };
      const buyerWallet = { id: "bw1", userId: "buyer-user" };
      const txn = { id: "txn1" };

      prisma.escrow.findUnique
        .mockResolvedValueOnce(escrowData)
        .mockResolvedValueOnce({ ...escrowData, status: "REFUNDED" });
      prisma.wallet.findUnique.mockResolvedValue(buyerWallet);
      prisma.transaction.create.mockResolvedValue(txn);
      prisma.wallet.update.mockResolvedValue({});
      prisma.escrow.update.mockResolvedValue({
        ...escrowData,
        status: "REFUNDED",
        refundedTxnId: "txn1",
      });

      const result = await service.refund("buyer-user", "e1");
      expect(result!.status).toBe("REFUNDED");
      expect(prisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: "REVERSAL", walletId: "bw1" }),
        })
      );
    });

    it("allows refund when order is refund_requested", async () => {
      const escrowData = {
        ...baseEscrow,
        order: { ...baseEscrow.order, status: "refund_requested", updatedAt: new Date() },
      };
      const buyerWallet = { id: "bw1", userId: "buyer-user" };
      const txn = { id: "txn1" };

      prisma.escrow.findUnique
        .mockResolvedValueOnce(escrowData)
        .mockResolvedValueOnce({ ...escrowData, status: "REFUNDED" });
      prisma.wallet.findUnique.mockResolvedValue(buyerWallet);
      prisma.transaction.create.mockResolvedValue(txn);
      prisma.wallet.update.mockResolvedValue({});
      prisma.escrow.update.mockResolvedValue({
        ...escrowData,
        status: "REFUNDED",
        refundedTxnId: "txn1",
      });

      const result = await service.refund("buyer-user", "e1");
      expect(result!.status).toBe("REFUNDED");
    });

    it("uses atomic claim pattern - second call throws ConflictException", async () => {
      const escrowData = {
        ...baseEscrow,
        order: { ...baseEscrow.order, status: "cancelled", updatedAt: new Date() },
      };
      const buyerWallet = { id: "bw1", userId: "buyer-user" };
      const txn = { id: "txn1" };

      prisma.escrow.findUnique.mockResolvedValue(escrowData);
      prisma.wallet.findUnique.mockResolvedValue(buyerWallet);
      prisma.transaction.create.mockResolvedValue(txn);
      prisma.wallet.update.mockResolvedValue({});
      prisma.escrow.updateMany
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 0 });

      await service.refund("buyer-user", "e1");
      await expect(service.refund("buyer-user", "e1")).rejects.toThrow(ConflictException);
    });
  });

  describe("releaseForDelivery (internal)", () => {
    it("releases escrow when HELD and order delivered", async () => {
      const escrowData = { ...baseEscrow };
      const vendorWallet = { id: "vw1", userId: "vendor-user", currency: "GHS" };
      const txn = { id: "txn1" };

      prisma.escrow.findUnique.mockResolvedValue(escrowData);
      prisma.wallet.findUnique.mockResolvedValue(vendorWallet);
      prisma.transaction.create.mockResolvedValue(txn);
      prisma.wallet.update.mockResolvedValue({});
      prisma.escrow.updateMany.mockResolvedValue({ count: 1 });
      prisma.escrow.update.mockResolvedValue({});

      await service.releaseForDelivery("e1");

      expect(prisma.escrow.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "e1", status: "HELD" },
          data: { status: "RELEASED" },
        })
      );
    });

    it("does nothing if escrow not found", async () => {
      prisma.escrow.findUnique.mockResolvedValue(null);
      await expect(service.releaseForDelivery("e1")).resolves.toBeUndefined();
    });

    it("does nothing if escrow not HELD", async () => {
      prisma.escrow.findUnique.mockResolvedValue({ ...baseEscrow, status: "RELEASED" });
      await expect(service.releaseForDelivery("e1")).resolves.toBeUndefined();
    });
  });

  describe("refundForCancellation (internal)", () => {
    it("refunds escrow when HELD", async () => {
      const escrowData = {
        ...baseEscrow,
        order: { ...baseEscrow.order, status: "cancelled" },
      };
      const buyerWallet = { id: "bw1", userId: "buyer-user" };
      const txn = { id: "txn1" };

      prisma.escrow.findUnique.mockResolvedValue(escrowData);
      prisma.wallet.findUnique.mockResolvedValue(buyerWallet);
      prisma.transaction.create.mockResolvedValue(txn);
      prisma.wallet.update.mockResolvedValue({});
      prisma.escrow.updateMany.mockResolvedValue({ count: 1 });
      prisma.escrow.update.mockResolvedValue({});

      await service.refundForCancellation("e1");

      expect(prisma.escrow.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "e1", status: "HELD" },
          data: { status: "REFUNDED" },
        })
      );
    });

    it("does nothing if escrow not found", async () => {
      prisma.escrow.findUnique.mockResolvedValue(null);
      await expect(service.refundForCancellation("e1")).resolves.toBeUndefined();
    });

    it("does nothing if escrow not HELD", async () => {
      prisma.escrow.findUnique.mockResolvedValue({ ...baseEscrow, status: "REFUNDED" });
      await expect(service.refundForCancellation("e1")).resolves.toBeUndefined();
    });
  });
});
