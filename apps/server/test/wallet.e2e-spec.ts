import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import * as bcrypt from "bcryptjs";
import { setupTestApp, MOCK_USER, createAuthenticatedRequest } from "./helpers";

/** Paths of every property named in `keys`, at any depth of `value`. */
function findKeysDeep(value: unknown, keys: string[], path = "$"): string[] {
  if (value === null || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => [
    ...(keys.includes(key) ? [`${path}.${key}`] : []),
    ...findKeysDeep(child, keys, `${path}.${key}`),
  ]);
}

const CARD_SECRET_KEYS = ["authorizationCode", "bin"];

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

  describe("card endpoints", () => {
    // Worst-case row: a Paystack-tokenized card. The authorization code is a
    // reusable charge token, so no card response may carry it (or the BIN).
    const cardRowWithSecrets = {
      id: "card1",
      walletId: "w1",
      type: "VISA",
      cardholderName: "Test User",
      last4: "4081",
      expiryMonth: "12",
      expiryYear: "2030",
      isDefault: true,
      authorizationCode: "AUTH_e2e_secret",
      bin: "408408",
      bank: "TEST BANK",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const PUBLIC_CARD_KEYS = [
      "id",
      "type",
      "cardholderName",
      "last4",
      "expiryMonth",
      "expiryYear",
      "isDefault",
      "bank",
      "createdAt",
      "updatedAt",
    ];

    const expectNoCardSecrets = (body: any) => {
      const cards = Array.isArray(body) ? body : [body];
      for (const card of cards) {
        expect(Object.keys(card).sort()).toEqual([...PUBLIC_CARD_KEYS].sort());
      }
      expect(findKeysDeep(body, CARD_SECRET_KEYS)).toEqual([]);
      expect(JSON.stringify(body)).not.toContain("AUTH_");
    };

    it("GET /wallet/cards should not expose the authorization code", async () => {
      prismaMock.wallet.findUnique.mockResolvedValue(mockWallet);
      prismaMock.card.findMany.mockResolvedValue([
        cardRowWithSecrets,
        { ...cardRowWithSecrets, id: "card2", isDefault: false, authorizationCode: "AUTH_other" },
      ]);

      const res = await createAuthenticatedRequest(app, prismaMock).get("/api/v1/wallet/cards");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].last4).toBe("4081");
      expectNoCardSecrets(res.body);
    });

    it("POST /wallet/cards/verify-save should not expose the authorization code", async () => {
      const originalKey = process.env.PAYSTACK_SECRET_KEY;
      process.env.PAYSTACK_SECRET_KEY = "sk_test_e2e";
      try {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              status: true,
              data: {
                status: "success",
                amount: 100,
                customer: { email: MOCK_USER.email },
                metadata: { purpose: "card_verification" },
                authorization: {
                  authorization_code: cardRowWithSecrets.authorizationCode,
                  card_type: "visa",
                  last4: "4081",
                  exp_month: "12",
                  exp_year: "2030",
                  bin: "408408",
                  bank: "TEST BANK",
                },
              },
            }),
        });
        prismaMock.wallet.findUnique.mockResolvedValue(mockWallet);
        prismaMock.transaction.findUnique.mockResolvedValue(null);
        prismaMock.$transaction = jest.fn((cb: any) => cb(prismaMock));
        prismaMock.wallet.update.mockResolvedValue(mockWallet);
        prismaMock.transaction.create.mockResolvedValue({});
        prismaMock.card.create.mockResolvedValue(cardRowWithSecrets);

        const res = await createAuthenticatedRequest(app, prismaMock)
          .post("/api/v1/wallet/cards/verify-save")
          .send({ reference: "ref_card_1", cardholderName: "Test User", isDefault: true });

        expect(res.status).toBe(201);
        expect(res.body.id).toBe("card1");
        expectNoCardSecrets(res.body);
        // The token is still persisted server-side for later charges.
        expect(prismaMock.card.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            authorizationCode: cardRowWithSecrets.authorizationCode,
          }),
        });
      } finally {
        process.env.PAYSTACK_SECRET_KEY = originalKey;
      }
    });

    it("POST /wallet/cards should not expose the authorization code", async () => {
      prismaMock.wallet.findUnique.mockResolvedValue(mockWallet);
      prismaMock.card.count.mockResolvedValue(0);
      prismaMock.card.create.mockResolvedValue(cardRowWithSecrets);

      const res = await createAuthenticatedRequest(app, prismaMock)
        .post("/api/v1/wallet/cards")
        .send({
          type: "VISA",
          cardholderName: "Test User",
          last4: "4081",
          expiryMonth: "12",
          expiryYear: "2030",
        });

      expect(res.status).toBe(201);
      expectNoCardSecrets(res.body);
    });

    it("PUT /wallet/cards/:id should not expose the authorization code", async () => {
      prismaMock.wallet.findUnique.mockResolvedValue(mockWallet);
      prismaMock.card.findUnique.mockResolvedValue(cardRowWithSecrets);
      prismaMock.card.update.mockResolvedValue({
        ...cardRowWithSecrets,
        cardholderName: "Renamed",
      });

      const res = await createAuthenticatedRequest(app, prismaMock)
        .put("/api/v1/wallet/cards/card1")
        .send({ cardholderName: "Renamed" });

      expect(res.status).toBe(200);
      expect(res.body.cardholderName).toBe("Renamed");
      expectNoCardSecrets(res.body);
    });
  });
});
