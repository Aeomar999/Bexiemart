import { ReferralsService } from "./referrals.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

const mockPrisma = (): any => ({
  $queryRaw: jest.fn(),
  $transaction: jest.fn((cb: any) => cb(mockPrisma())),
  wallet: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  transaction: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), count: jest.fn(), update: jest.fn() },
  product: { findUnique: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
  cart: { findUnique: jest.fn(), create: jest.fn() },
  cartItem: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
  order: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
  orderItem: { findMany: jest.fn(), create: jest.fn() },
  shippingAddress: { create: jest.fn() },
  escrow: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
  user: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), count: jest.fn() },
  vendorProfile: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), create: jest.fn() },
  referral: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn() },
  referredUser: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn() },
  conversation: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  conversationParticipant: { findMany: jest.fn(), updateMany: jest.fn() },
  message: { findMany: jest.fn(), create: jest.fn(), count: jest.fn() },
  platformConfig: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn() },
  category: { findUnique: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
});

describe("ReferralsService", () => {
  let service: ReferralsService;

  beforeEach(() => {
    service = new ReferralsService(mockPrisma() as any);
  });

  describe("generate", () => {
    it("should return existing referral if found", async () => {
      const existing = { id: "1", userId: "user1", code: "ABC123" };
      (service as any).prisma.referral.findUnique.mockResolvedValue(existing);

      const result = await service.generate("user1");

      expect(result).toEqual(existing);
      expect((service as any).prisma.referral.findUnique).toHaveBeenCalledWith({
        where: { userId: "user1" },
      });
    });

    it("should create new referral with unique code", async () => {
      (service as any).prisma.referral.findUnique.mockResolvedValue(null);
      (service as any).prisma.referral.create.mockResolvedValue({
        id: "2",
        userId: "user2",
        code: "UNIQUE1",
      });

      const result = await service.generate("user2");

      expect(result).toEqual({ id: "2", userId: "user2", code: "UNIQUE1" });
      expect((service as any).prisma.referral.create).toHaveBeenCalledWith({
        data: { userId: "user2", code: expect.any(String) },
      });
    });
  });

  describe("getMyReferral", () => {
    it("should throw NotFoundException if no referral", async () => {
      (service as any).prisma.referral.findUnique.mockResolvedValue(null);

      await expect(service.getMyReferral("user1")).rejects.toThrow(NotFoundException);
    });

    it("should return referral with referred users", async () => {
      const mockReferral = {
        id: "1",
        userId: "user1",
        code: "ABC",
        referredUsers: [
          {
            id: "r1",
            referredUser: { id: "u2", name: "User2", email: "u2@test.com", image: null },
          },
        ],
      };
      (service as any).prisma.referral.findUnique.mockResolvedValue(mockReferral);

      const result = await service.getMyReferral("user1");

      expect(result).toEqual(mockReferral);
    });
  });

  describe("apply", () => {
    it("should throw NotFoundException if code is invalid", async () => {
      (service as any).prisma.referral.findUnique.mockResolvedValue(null);

      await expect(service.apply("user1", "INVALID")).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if applying own code", async () => {
      (service as any).prisma.referral.findUnique.mockResolvedValue({
        id: "1",
        userId: "user1",
        code: "MYCODE",
      });

      await expect(service.apply("user1", "MYCODE")).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if already referred", async () => {
      (service as any).prisma.referral.findUnique.mockResolvedValue({
        id: "1",
        userId: "user2",
        code: "OTHER",
      });
      (service as any).prisma.referredUser.findUnique.mockResolvedValue({
        id: "e1",
        referredUserId: "user1",
      });

      await expect(service.apply("user1", "OTHER")).rejects.toThrow(BadRequestException);
    });

    it("should create ReferredUser on success", async () => {
      (service as any).prisma.referral.findUnique.mockResolvedValue({
        id: "1",
        userId: "user2",
        code: "VALID",
      });
      (service as any).prisma.referredUser.findUnique.mockResolvedValue(null);
      (service as any).prisma.referredUser.create.mockResolvedValue({
        id: "r1",
        referralId: "1",
        referredUserId: "user1",
      });

      const result = await service.apply("user1", "VALID");

      expect(result).toEqual({ message: "Referral code applied successfully" });
      expect((service as any).prisma.referredUser.create).toHaveBeenCalledWith({
        data: { referralId: "1", referredUserId: "user1" },
      });
    });
  });

  describe("getStats", () => {
    it("should throw NotFoundException if no referral", async () => {
      (service as any).prisma.referral.findUnique.mockResolvedValue(null);

      await expect(service.getStats("user1")).rejects.toThrow(NotFoundException);
    });

    it("should return totalReferrals, completedCount, totalRewardsEarned", async () => {
      (service as any).prisma.referral.findUnique.mockResolvedValue({
        id: "1",
        userId: "user1",
        code: "ABC",
        rewardAmount: 500,
        referredUsers: [
          { status: "COMPLETED" },
          { status: "PENDING" },
          { status: "COMPLETED" },
        ],
      });

      const result = await service.getStats("user1");

      expect(result).toEqual({
        totalReferrals: 3,
        completedCount: 2,
        totalRewardsEarned: 500,
      });
    });
  });
});
