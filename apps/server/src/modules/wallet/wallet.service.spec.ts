import { WalletService } from "./wallet.service";
import { mockPrisma } from "../../prisma/prisma.mock";
import * as bcrypt from "bcryptjs";
import { BadRequestException, NotFoundException, ForbiddenException } from "@nestjs/common";

/** Paths of every property named in `keys`, at any depth of `value`. */
function findKeysDeep(value: unknown, keys: string[], path = "$"): string[] {
  if (value === null || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => [
    ...(keys.includes(key) ? [`${path}.${key}`] : []),
    ...findKeysDeep(child, keys, `${path}.${key}`),
  ]);
}

const SECRET_KEYS = [
  "authorizationCode",
  "bin",
  "password",
  "pinHash",
  "pinFailures",
  "pinLockedUntil",
];

describe("WalletService", () => {
  let service: WalletService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma();
    const configMock = {
      get: jest.fn((key: string) => {
        if (key === "PAYSTACK_SECRET_KEY") return "test_secret_key";
        if (key === "BETTER_AUTH_URL") return "http://localhost:3000";
        return undefined;
      }),
    };
    service = new WalletService(prisma as any, configMock as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getWallet", () => {
    it("should return existing wallet", async () => {
      const wallet = {
        id: "w1",
        userId: "u1",
        balance: 100,
        currency: "GHS",
        status: "ACTIVE",
        user: { id: "u1" },
      };
      prisma.wallet.findUnique.mockResolvedValue(wallet);
      const result = await service.getWallet("u1");
      expect(result).toEqual(wallet);
      expect(prisma.wallet.findUnique).toHaveBeenCalledWith({
        where: { userId: "u1" },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
    });

    it("should create wallet if not found", async () => {
      prisma.wallet.findUnique.mockResolvedValue(null);
      const newWallet = {
        id: "w2",
        userId: "u1",
        balance: 0,
        currency: "GHS",
        status: "ACTIVE",
        user: { id: "u1" },
      };
      prisma.wallet.create.mockResolvedValue(newWallet);
      const result = await service.getWallet("u1");
      expect(result).toEqual(newWallet);
      expect(prisma.wallet.create).toHaveBeenCalledWith({
        data: { userId: "u1", balance: 0, currency: "GHS", status: "ACTIVE" },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
    });
  });

  describe("getPublicWallet", () => {
    it("should return only client-facing fields plus money held in escrow", async () => {
      const createdAt = new Date("2026-01-01");
      const updatedAt = new Date("2026-02-01");
      prisma.wallet.findUnique.mockResolvedValue({
        id: "w1",
        userId: "u1",
        balance: 100,
        currency: "GHS",
        status: "ACTIVE",
        bexieCoins: 25,
        pinHash: "$argon2id$v=19$m=65536,t=3,p=4$salt$hash",
        pinFailures: 3,
        pinLockedUntil: new Date(),
        createdAt,
        updatedAt,
        user: { id: "u1", name: "Ama", email: "ama@example.com", password: "hash" },
      });
      prisma.escrow.aggregate.mockResolvedValue({ _sum: { amount: 180 } });

      const result = await service.getPublicWallet("u1");

      expect(result).toEqual({
        id: "w1",
        balance: 100,
        currency: "GHS",
        status: "ACTIVE",
        bexieCoins: 25,
        heldInEscrow: 180,
        createdAt,
        updatedAt,
        user: { name: "Ama" },
      });
    });
  });

  describe("getHeldInEscrow", () => {
    it("sums only HELD escrow for the wallet's open orders", async () => {
      prisma.escrow.aggregate.mockResolvedValue({ _sum: { amount: 180 } });
      await expect(service.getHeldInEscrow("w1")).resolves.toBe(180);
      expect(prisma.escrow.aggregate).toHaveBeenCalledWith({
        where: {
          buyerWalletId: "w1",
          status: "HELD",
          order: { status: { notIn: ["delivered", "cancelled", "refunded"] } },
        },
        _sum: { amount: true },
      });
    });

    it("returns 0 when nothing is held", async () => {
      prisma.escrow.aggregate.mockResolvedValue({ _sum: { amount: null } });
      await expect(service.getHeldInEscrow("w1")).resolves.toBe(0);
    });
  });

  describe("getTransactions", () => {
    it("should return paginated transactions", async () => {
      const wallet = { id: "w1", userId: "u1", balance: 100, currency: "GHS", status: "ACTIVE" };
      prisma.wallet.findUnique.mockResolvedValue(wallet);
      const transactions = [{ id: "t1", amount: 50 }];
      prisma.transaction.findMany.mockResolvedValue(transactions);
      prisma.transaction.count.mockResolvedValue(1);
      const result = await service.getTransactions("u1", 1, 20);
      expect(result).toEqual({ data: transactions, total: 1, page: 1, pages: 1 });
    });
  });

  describe("verifyTopUp", () => {
    it("should throw NotFoundException if transaction not found", async () => {
      const wallet = { id: "w1", userId: "u1", balance: 100 };
      prisma.wallet.findUnique.mockResolvedValue(wallet);
      prisma.transaction.findUnique.mockResolvedValue(null);
      await expect(service.verifyTopUp("u1", "ref1")).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if unauthorized", async () => {
      const wallet = { id: "w1", userId: "u1", balance: 100 };
      const transaction = { id: "t1", walletId: "w2", status: "PENDING", amount: 50 };
      prisma.wallet.findUnique.mockResolvedValue(wallet);
      prisma.transaction.findUnique.mockResolvedValue(transaction);
      await expect(service.verifyTopUp("u1", "ref1")).rejects.toThrow(BadRequestException);
    });

    it("should complete pending top-up via $transaction", async () => {
      const wallet = { id: "w1", userId: "u1", balance: 100 };
      const transaction = { id: "t1", walletId: "w1", status: "PENDING", amount: 50 };
      prisma.wallet.findUnique
        .mockResolvedValueOnce(wallet)
        .mockResolvedValue({ ...wallet, balance: 150 });
      prisma.transaction.findUnique.mockResolvedValue(transaction);
      jest.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({ status: true, data: { status: "success" } }),
      } as any);
      prisma.$transaction.mockImplementation((arg: any, opts?: any) =>
        typeof arg === "function" ? arg(prisma) : Promise.all(arg)
      );
      prisma.transaction.update.mockResolvedValue({ ...transaction, status: "COMPLETED" });
      prisma.wallet.update.mockResolvedValue({ ...wallet, balance: 150 });
      const result = await service.verifyTopUp("u1", "ref1");
      expect(result).toEqual({ balance: 150 });
    });
  });

  describe("transfer", () => {
    it("should throw BadRequestException if insufficient balance", async () => {
      const wallet = { id: "w1", userId: "u1", balance: 10, user: { name: "Sender" } };
      prisma.wallet.findUnique.mockResolvedValue(wallet);
      await expect(service.transfer("u1", "recip@test.com", 100, "1234")).rejects.toThrow(
        BadRequestException
      );
    });

    it("should throw NotFoundException if recipient not found", async () => {
      const wallet = { id: "w1", userId: "u1", balance: 200, user: { name: "Sender" } };
      prisma.wallet.findUnique.mockResolvedValue(wallet);
      prisma.user.findUnique.mockResolvedValue(null);
      jest.spyOn(service, "verifyPin").mockResolvedValue({ valid: true });
      await expect(service.transfer("u1", "missing@test.com", 100, "1234")).rejects.toThrow(
        NotFoundException
      );
    });

    it("should create sent+received transactions and update both wallets", async () => {
      const senderWallet = { id: "w1", userId: "u1", balance: 200, user: { name: "Sender" } };
      const recipientUser = { id: "u2", email: "recip@test.com", name: "Recipient" };
      const recipientWallet = { id: "w2", userId: "u2", balance: 50, user: { name: "Recipient" } };
      const updatedSender = { ...senderWallet, balance: 100 };

      prisma.wallet.findUnique
        .mockResolvedValueOnce(senderWallet)
        .mockResolvedValueOnce(recipientWallet)
        .mockResolvedValueOnce(updatedSender);
      prisma.user.findUnique.mockResolvedValue(recipientUser);
      prisma.$transaction.mockImplementation((arg: any, opts?: any) =>
        typeof arg === "function" ? arg(prisma) : Promise.all(arg)
      );

      jest.spyOn(service, "verifyPin").mockResolvedValue({ valid: true });
      const result = await service.transfer("u1", "recip@test.com", 100, "1234");
      expect(result).toHaveProperty("reference");
      expect(result.newBalance).toBe(100);
      expect(prisma.wallet.update).toHaveBeenCalledTimes(2);
      expect(prisma.transaction.create).toHaveBeenCalledTimes(2);
    });
  });

  describe("setPin", () => {
    it("should store an argon2 hash without returning it", async () => {
      const wallet = { id: "w1", userId: "u1", balance: 100 };
      prisma.wallet.findUnique.mockResolvedValue(wallet);
      prisma.wallet.update.mockResolvedValue({ ...wallet, pinHash: "hashed" });
      const result = await service.setPin("u1", "1234");
      expect(result).toEqual({ success: true });
      expect(prisma.wallet.update).toHaveBeenCalledWith({
        where: { id: "w1" },
        data: {
          pinHash: expect.stringMatching(/^\$argon2id\$/),
          pinFailures: 0,
          pinLockedUntil: null,
        },
      });
    });
  });

  describe("verifyPin", () => {
    it("should throw BadRequestException if PIN not set", async () => {
      const wallet = { id: "w1", userId: "u1", pinHash: null };
      prisma.wallet.findUnique.mockResolvedValue(wallet);
      await expect(service.verifyPin("u1", "1234")).rejects.toThrow(BadRequestException);
    });

    it("should throw ForbiddenException if locked", async () => {
      const future = new Date(Date.now() + 60000);
      const wallet = {
        id: "w1",
        userId: "u1",
        pinHash: "hash",
        pinLockedUntil: future,
        pinFailures: 5,
      };
      prisma.wallet.findUnique.mockResolvedValue(wallet);
      await expect(service.verifyPin("u1", "1234")).rejects.toThrow(ForbiddenException);
    });

    it("should throw BadRequestException on wrong PIN", async () => {
      const wallet = {
        id: "w1",
        userId: "u1",
        pinHash: "hash",
        pinLockedUntil: null,
        pinFailures: 2,
      };
      prisma.wallet.findUnique.mockResolvedValue(wallet);
      jest.spyOn(bcrypt, "compare").mockResolvedValue(false as never);
      await expect(service.verifyPin("u1", "wrong")).rejects.toThrow(BadRequestException);
      expect(prisma.wallet.update).toHaveBeenCalledWith({
        where: { id: "w1" },
        data: { pinFailures: 3 },
      });
    });

    it("should return valid on correct PIN", async () => {
      const wallet = {
        id: "w1",
        userId: "u1",
        pinHash: "hash",
        pinLockedUntil: null,
        pinFailures: 1,
      };
      prisma.wallet.findUnique.mockResolvedValue(wallet);
      jest.spyOn(bcrypt, "compare").mockResolvedValue(true as never);
      prisma.wallet.update.mockResolvedValue({ ...wallet, pinFailures: 0, pinLockedUntil: null });
      const result = await service.verifyPin("u1", "correct");
      expect(result).toEqual({ valid: true });
    });

    it("should lock after 5 failures", async () => {
      const wallet = {
        id: "w1",
        userId: "u1",
        pinHash: "hash",
        pinLockedUntil: null,
        pinFailures: 4,
      };
      prisma.wallet.findUnique.mockResolvedValue(wallet);
      jest.spyOn(bcrypt, "compare").mockResolvedValue(false as never);
      await expect(service.verifyPin("u1", "wrong")).rejects.toThrow(ForbiddenException);
      expect(prisma.wallet.update).toHaveBeenCalledWith({
        where: { id: "w1" },
        data: expect.objectContaining({ pinFailures: 5, pinLockedUntil: expect.any(Date) }),
      });
    });
  });

  describe("getPinStatus", () => {
    it("should return isLocked, hasPin, failuresRemaining", async () => {
      const wallet = {
        id: "w1",
        userId: "u1",
        pinHash: "hash",
        pinLockedUntil: null,
        pinFailures: 2,
      };
      prisma.wallet.findUnique.mockResolvedValue(wallet);
      const result = await service.getPinStatus("u1");
      expect(result).toEqual({ hasPin: true, isLocked: false, failuresRemaining: 3 });
    });
  });

  describe("getCards", () => {
    it("should return cards without authorizationCode or bin", async () => {
      const wallet = { id: "w1", userId: "u1", balance: 100, currency: "GHS", status: "ACTIVE" };
      prisma.wallet.findUnique.mockResolvedValue(wallet);
      const cards = [
        {
          id: "c1",
          type: "VISA",
          cardholderName: "John Doe",
          last4: "1234",
          expiryMonth: "12",
          expiryYear: "2028",
          isDefault: true,
          authorizationCode: "auth_secret_123",
          bin: "424242",
          bank: "Test Bank",
          createdAt: new Date("2026-01-01"),
          updatedAt: new Date("2026-01-01"),
        },
      ];
      prisma.card.findMany.mockResolvedValue(cards);

      const result = await service.getCards("u1");

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "c1",
        type: "VISA",
        cardholderName: "John Doe",
        last4: "1234",
        expiryMonth: "12",
        expiryYear: "2028",
        isDefault: true,
        createdAt: cards[0].createdAt,
        updatedAt: cards[0].updatedAt,
      });
      expect(findKeysDeep(result, ["authorizationCode", "bin"])).toEqual([]);
    });
  });

  describe("verifyAndSaveCard", () => {
    beforeEach(() => {
      process.env.PAYSTACK_SECRET_KEY = "test_secret_key";
    });

    afterEach(() => {
      delete process.env.PAYSTACK_SECRET_KEY;
    });

    it("should return saved card without authorizationCode or bin", async () => {
      const wallet = {
        id: "w1",
        userId: "u1",
        balance: 100,
        currency: "GHS",
        status: "ACTIVE",
        user: { id: "u1", email: "test@example.com", name: "Test" },
      };
      prisma.wallet.findUnique.mockResolvedValue(wallet);
      prisma.transaction.findUnique.mockResolvedValue(null);
      jest.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({
          status: true,
          data: {
            status: "success",
            customer: { email: "test@example.com" },
            amount: 100,
            metadata: { purpose: "card_verification" },
            authorization: {
              card_type: "visa",
              last4: "1234",
              exp_month: "12",
              exp_year: "2028",
              authorization_code: "auth_secret_123",
              bin: "424242",
              bank: "Test Bank",
            },
          },
        }),
      } as any);
      prisma.$transaction.mockImplementation((arg: any) => {
        const tx = mockPrisma();
        tx.card.create.mockResolvedValue({
          id: "c1",
          type: "VISA",
          cardholderName: "John Doe",
          last4: "1234",
          expiryMonth: "12",
          expiryYear: "2028",
          isDefault: true,
          authorizationCode: "auth_secret_123",
          bin: "424242",
          bank: "Test Bank",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return arg(tx);
      });

      const result = await service.verifyAndSaveCard("u1", "ref123", "John Doe", true);

      expect(result).toEqual({
        id: "c1",
        type: "VISA",
        cardholderName: "John Doe",
        last4: "1234",
        expiryMonth: "12",
        expiryYear: "2028",
        isDefault: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(findKeysDeep(result, ["authorizationCode", "bin"])).toEqual([]);
    });
  });

  describe("addCard", () => {
    it("should add card and return without authorizationCode or bin", async () => {
      const wallet = { id: "w1", userId: "u1", balance: 100, currency: "GHS", status: "ACTIVE" };
      prisma.wallet.findUnique.mockResolvedValue(wallet);
      prisma.card.count.mockResolvedValue(0);
      prisma.card.create.mockResolvedValue({
        id: "c1",
        type: "MASTERCARD",
        cardholderName: "Jane Doe",
        last4: "5678",
        expiryMonth: "06",
        expiryYear: "2027",
        isDefault: true,
        authorizationCode: null,
        bin: null,
        bank: null,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
      });

      const result = await service.addCard("u1", {
        type: "MASTERCARD",
        cardholderName: "Jane Doe",
        last4: "5678",
        expiryMonth: "06",
        expiryYear: "2027",
      });

      expect(result).toEqual({
        id: "c1",
        type: "MASTERCARD",
        cardholderName: "Jane Doe",
        last4: "5678",
        expiryMonth: "06",
        expiryYear: "2027",
        isDefault: true,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
      });
      expect(findKeysDeep(result, ["authorizationCode", "bin"])).toEqual([]);
    });
  });

  describe("updateCard", () => {
    it("should update card and return without authorizationCode or bin", async () => {
      const wallet = { id: "w1", userId: "u1", balance: 100, currency: "GHS", status: "ACTIVE" };
      prisma.wallet.findUnique.mockResolvedValue(wallet);
      prisma.card.findUnique.mockResolvedValue({
        id: "c1",
        walletId: "w1",
        type: "VISA",
        cardholderName: "John Doe",
        last4: "1234",
        expiryMonth: "12",
        expiryYear: "2028",
        isDefault: false,
        authorizationCode: "auth_secret_123",
        bin: "424242",
        bank: "Test Bank",
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
      });
      prisma.card.updateMany.mockResolvedValue({});
      prisma.card.update.mockResolvedValue({
        id: "c1",
        walletId: "w1",
        type: "VISA",
        cardholderName: "John Updated",
        last4: "1234",
        expiryMonth: "12",
        expiryYear: "2029",
        isDefault: true,
        authorizationCode: "auth_secret_123",
        bin: "424242",
        bank: "Test Bank",
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-02-01"),
      });

      const result = await service.updateCard("u1", "c1", {
        cardholderName: "John Updated",
        expiryYear: "2029",
        isDefault: true,
      });

      expect(result).toEqual({
        id: "c1",
        type: "VISA",
        cardholderName: "John Updated",
        last4: "1234",
        expiryMonth: "12",
        expiryYear: "2029",
        isDefault: true,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-02-01"),
      });
      expect(findKeysDeep(result, ["authorizationCode", "bin"])).toEqual([]);
    });
  });
});
