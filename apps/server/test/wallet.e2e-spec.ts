import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import * as bcrypt from "bcryptjs";
import { setupTestApp, MOCK_USER, createAuthenticatedRequest } from "./helpers";

describe("Wallet (e2e)", () => {
  let app: INestApplication;
  let prismaMock: any;
  let originalFetch: typeof global.fetch;

  beforeAll(async () => {
    const test = await setupTestApp();
    app = test.app;
    prismaMock = test.prismaMock;
    originalFetch = global.fetch;
  });

  afterAll(async () => {
    global.fetch = originalFetch;
    await app.close();
  });

  const mockWallet = {
    id: "w1",
    userId: MOCK_USER.id,
    balance: 1000,
    currency: "GHS",
    status: "ACTIVE",
    pinHash: null,
    pinFailures: 0,
    pinLockedUntil: null,
    user: { ...MOCK_USER },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTransaction = {
    id: "tx1",
    walletId: "w1",
    type: "TOPUP",
    status: "PENDING",
    amount: 500,
    netAmount: 500,
    fee: 0,
    reference: "tu_w1_1234567890",
    description: "Wallet top up",
    providerRef: null,
    counterpartyWalletId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("GET /api/v1/wallet", () => {
    it("should get wallet balance", async () => {
      prismaMock.wallet.findUnique.mockResolvedValue(mockWallet);

      const res = await createAuthenticatedRequest(app, prismaMock).get("/api/v1/wallet");

      expect(res.status).toBe(200);
      expect(res.body.id).toBe("w1");
      expect(res.body.balance).toBe(1000);
      expect(res.body.currency).toBe("GHS");
    });
  });

  describe("POST /api/v1/wallet/topup/initialize", () => {
    it("should initialize topup", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            status: true,
            data: { authorization_url: "https://paystack.com/authorize/ref_123" },
          }),
      });

      prismaMock.wallet.findUnique.mockResolvedValue(mockWallet);
      prismaMock.transaction.create.mockResolvedValue(mockTransaction);

      const res = await createAuthenticatedRequest(app, prismaMock)
        .post("/api/v1/wallet/topup/initialize")
        .send({ amount: 500, channel: "MOMO" });

      expect(res.status).toBe(201);
      expect(res.body.authorizationUrl).toBeDefined();
      expect(res.body.reference).toBeDefined();
    });
  });

  describe("GET /api/v1/wallet/topup/verify/:ref", () => {
    it("should verify topup", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            status: true,
            data: { status: "success" },
          }),
      });

      prismaMock.wallet.findUnique.mockResolvedValue(mockWallet);
      prismaMock.transaction.findUnique.mockResolvedValue({
        ...mockTransaction,
        status: "PENDING",
        walletId: "w1",
      });
      prismaMock.$transaction = jest.fn((cb: any) => cb(prismaMock));
      prismaMock.transaction.update.mockResolvedValue({
        ...mockTransaction,
        status: "COMPLETED",
      });
      prismaMock.wallet.update.mockResolvedValue({
        ...mockWallet,
        balance: 1500,
      });

      const res = await createAuthenticatedRequest(app, prismaMock).get(
        "/api/v1/wallet/topup/verify/tu_w1_1234567890"
      );

      expect(res.status).toBe(200);
      expect(res.body.balance).toBeDefined();
    });
  });

  describe("POST /api/v1/wallet/transfer", () => {
    it("should transfer funds", async () => {
      const pinHash = bcrypt.hashSync("1234", 10);
      const walletWithPin = {
        ...mockWallet,
        balance: 2000,
        pinHash,
        pinFailures: 0,
        pinLockedUntil: null,
        user: { ...MOCK_USER },
      };

      const recipientUser = {
        id: "u2",
        email: "recipient@example.com",
        name: "Recipient User",
        role: "CUSTOMER",
      };

      const recipientWallet = {
        ...mockWallet,
        id: "w2",
        userId: "u2",
        balance: 500,
        pinHash: null,
        user: { ...recipientUser },
      };

      prismaMock.wallet.findUnique.mockImplementation((args: any) => {
        if (args?.where?.userId === "u2") return Promise.resolve(recipientWallet);
        return Promise.resolve(walletWithPin);
      });
      prismaMock.user.findUnique.mockResolvedValue(recipientUser);
      prismaMock.$transaction = jest.fn((cb: any) => cb(prismaMock));
      prismaMock.wallet.update.mockResolvedValue(walletWithPin);
      prismaMock.transaction.create.mockResolvedValue({});

      const res = await createAuthenticatedRequest(app, prismaMock)
        .post("/api/v1/wallet/transfer")
        .send({ recipientEmail: "recipient@example.com", amount: 500, pin: "1234" });

      expect(res.status).toBe(201);
      expect(res.body.reference).toBeDefined();
      expect(res.body.newBalance).toBeDefined();
    });
  });

  describe("GET /api/v1/wallet/transactions", () => {
    it("should get transactions", async () => {
      prismaMock.wallet.findUnique.mockResolvedValue(mockWallet);
      prismaMock.transaction.findMany.mockResolvedValue([mockTransaction]);
      prismaMock.transaction.count.mockResolvedValue(1);

      const res = await createAuthenticatedRequest(app, prismaMock).get(
        "/api/v1/wallet/transactions"
      );

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.total).toBe(1);
      expect(res.body.page).toBe(1);
    });
  });

  describe("POST /api/v1/wallet/pin", () => {
    it("should set PIN", async () => {
      prismaMock.wallet.findUnique.mockResolvedValue(mockWallet);
      prismaMock.wallet.update.mockResolvedValue({
        ...mockWallet,
        pinHash: "hashed_pin",
        pinFailures: 0,
        pinLockedUntil: null,
      });

      const res = await createAuthenticatedRequest(app, prismaMock)
        .post("/api/v1/wallet/pin")
        .send({ pin: "1234" });

      expect(res.status).toBe(201);
      expect(res.body.pinFailures).toBe(0);
    });
  });
});
