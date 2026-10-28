import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import * as crypto from "crypto";
import { setupTestApp, MOCK_USER, createAuthenticatedRequest } from "./helpers";

// Set the webhook secret before the app is constructed so the service caches it.
process.env.PAYSTACK_SECRET_KEY = "test_webhook_secret";

describe("Payments (e2e)", () => {
  let app: INestApplication;
  let prismaMock: any;

  beforeAll(async () => {
    const test = await setupTestApp();
    app = test.app;
    prismaMock = test.prismaMock;
  });

  afterAll(async () => {
    delete process.env.PAYSTACK_SECRET_KEY;
    await app.close();
  });

  const mockOrder = {
    id: "o1",
    userId: MOCK_USER.id,
    total: 5000,
    paymentStatus: "pending",
    status: "pending",
  };

  const mockUser = {
    ...MOCK_USER,
    email: "buyer@example.com",
  };

  describe("POST /api/v1/payments/initialize", () => {
    it("should initialize a payment and return authorization URL", async () => {
      prismaMock.order.findFirst.mockResolvedValue(mockOrder);
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            status: true,
            data: {
              authorization_url: "https://paystack.com/authorize/ref_123",
              reference: "BEX-o1-1234567890",
            },
          }),
      });
      prismaMock.order.update.mockResolvedValue({ ...mockOrder, paystackRef: "ref_123" });

      const res = await createAuthenticatedRequest(app, prismaMock)
        .post("/api/v1/payments/initialize")
        .send({ orderId: "o1" });

      expect(res.status).toBe(201);
      expect(res.body.authorizationUrl).toBe("https://paystack.com/authorize/ref_123");
      expect(res.body.reference).toBe("BEX-o1-1234567890");
    });

    it("should return 404 when order not found", async () => {
      prismaMock.order.findFirst.mockResolvedValue(null);

      const res = await createAuthenticatedRequest(app, prismaMock)
        .post("/api/v1/payments/initialize")
        .send({ orderId: "nonexistent" });

      expect(res.status).toBe(404);
    });

    it("should return 400 when payment already processed", async () => {
      prismaMock.order.findFirst.mockResolvedValue({
        ...mockOrder,
        paymentStatus: "success",
      });

      const res = await createAuthenticatedRequest(app, prismaMock)
        .post("/api/v1/payments/initialize")
        .send({ orderId: "o1" });

      expect(res.status).toBe(400);
    });

    it("should return 400 for missing orderId", async () => {
      const res = await createAuthenticatedRequest(app, prismaMock)
        .post("/api/v1/payments/initialize")
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/v1/payments/verify/:reference", () => {
    it("should verify a successful payment", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            status: true,
            data: {
              status: "success",
              reference: "ref_123",
              amount: 500000,
              currency: "GHS",
              channel: "card",
              paidAt: "2024-01-01T00:00:00Z",
            },
          }),
      });

      prismaMock.order.findFirst.mockResolvedValue({
        ...mockOrder,
        paystackRef: "ref_123",
        paymentStatus: "pending",
        payment: null,
      });
      prismaMock.$transaction = jest.fn((cb: any) => cb(prismaMock));
      prismaMock.order.update.mockResolvedValue({ ...mockOrder, paymentStatus: "success" });
      prismaMock.payment.upsert.mockResolvedValue({});
      prismaMock.transaction.findMany.mockResolvedValue([]);
      prismaMock.wallet.findUnique.mockResolvedValue({ id: "w1", userId: MOCK_USER.id });
      prismaMock.escrow.count.mockResolvedValue(0);
      prismaMock.escrow.upsert.mockResolvedValue({});
      prismaMock.orderItem.findMany.mockResolvedValue([]);

      const res = await createAuthenticatedRequest(app, prismaMock).get(
        "/api/v1/payments/verify/ref_123"
      );

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.reference).toBe("ref_123");
    });

    it("should return 404 when order not found for reference", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: true, data: { status: "success" } }),
      });
      prismaMock.order.findFirst.mockResolvedValue(null);

      const res = await createAuthenticatedRequest(app, prismaMock).get(
        "/api/v1/payments/verify/ref_123"
      );

      expect(res.status).toBe(404);
    });

    it("should return idempotent success when already paid", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: true, data: { status: "success" } }),
      });
      prismaMock.order.findFirst.mockResolvedValue({
        ...mockOrder,
        paystackRef: "ref_123",
        paymentStatus: "success",
        payment: { status: "success" },
      });

      const res = await createAuthenticatedRequest(app, prismaMock).get(
        "/api/v1/payments/verify/ref_123"
      );

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
    });
  });

  describe("POST /api/v1/payments/charge-card", () => {
    it("should charge a saved card successfully", async () => {
      prismaMock.order.findFirst.mockResolvedValue(mockOrder);
      prismaMock.card.findFirst.mockResolvedValue({
        id: "c1",
        wallet: { userId: MOCK_USER.id, user: mockUser },
        authorizationCode: "auth_secret_123",
      });
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            status: true,
            data: {
              status: "success",
              reference: "ref_charge_123",
              channel: "card",
            },
          }),
      });
      prismaMock.$transaction = jest.fn((cb: any) => cb(prismaMock));
      prismaMock.order.update.mockResolvedValue({ ...mockOrder, paymentStatus: "success" });
      prismaMock.payment.upsert.mockResolvedValue({});
      prismaMock.transaction.findMany.mockResolvedValue([]);
      prismaMock.wallet.findUnique.mockResolvedValue({ id: "w1", userId: MOCK_USER.id });
      prismaMock.escrow.count.mockResolvedValue(0);
      prismaMock.escrow.upsert.mockResolvedValue({});
      prismaMock.orderItem.findMany.mockResolvedValue([]);

      const res = await createAuthenticatedRequest(app, prismaMock)
        .post("/api/v1/payments/charge-card")
        .send({ orderId: "o1", cardId: "c1" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.reference).toMatch(/^BEX-o1-\d+$/);
    });

    it("should return 404 when order not found", async () => {
      prismaMock.order.findFirst.mockResolvedValue(null);

      const res = await createAuthenticatedRequest(app, prismaMock)
        .post("/api/v1/payments/charge-card")
        .send({ orderId: "nonexistent", cardId: "c1" });

      expect(res.status).toBe(404);
    });

    it("should return 400 when no valid saved card", async () => {
      prismaMock.order.findFirst.mockResolvedValue(mockOrder);
      prismaMock.card.findFirst.mockResolvedValue(null);

      const res = await createAuthenticatedRequest(app, prismaMock)
        .post("/api/v1/payments/charge-card")
        .send({ orderId: "o1", cardId: "c1" });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/v1/payments/webhook", () => {
    const secret = "test_webhook_secret";

    const makeSignedBody = (body: any) => {
      const rawBody = JSON.stringify(body);
      const signature = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
      return { rawBody, signature, body };
    };

    it("should return 403 for invalid HMAC signature", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/v1/payments/webhook")
        .set("x-paystack-signature", "invalid_signature")
        .send({ event: "charge.success", data: { reference: "ref_123" } });

      expect(res.status).toBe(403);
    });

    it("should acknowledge charge.success webhook and update order", async () => {
      const { rawBody, signature, body } = makeSignedBody({
        event: "charge.success",
        data: {
          reference: "ref_webhook_123",
          amount: 500000,
          currency: "GHS",
          channel: "card",
          paidAt: "2024-01-01T00:00:00Z",
        },
      });

      prismaMock.order.findFirst.mockResolvedValue({
        ...mockOrder,
        paystackRef: "ref_webhook_123",
        paymentStatus: "pending",
        payment: null,
      });
      prismaMock.$transaction = jest.fn((cb: any) => cb(prismaMock));
      prismaMock.order.update.mockResolvedValue({ ...mockOrder, paymentStatus: "success" });
      prismaMock.payment.upsert.mockResolvedValue({});
      prismaMock.transaction.findMany.mockResolvedValue([]);
      prismaMock.wallet.findUnique.mockResolvedValue({ id: "w1", userId: MOCK_USER.id });
      prismaMock.escrow.count.mockResolvedValue(0);
      prismaMock.escrow.upsert.mockResolvedValue({});
      prismaMock.orderItem.findMany.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .post("/api/v1/payments/webhook")
        .set("x-paystack-signature", signature)
        .set("Content-Type", "application/json")
        .send(body);

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);
    });

    it("should acknowledge transfer.success webhook for withdrawal", async () => {
      const { rawBody, signature, body } = makeSignedBody({
        event: "transfer.success",
        data: { reference: "wd_ref_123" },
      });

      prismaMock.transaction.findUnique.mockResolvedValue({
        id: "tx1",
        type: "WITHDRAWAL",
        status: "PENDING",
        amount: 5000,
        walletId: "w1",
      });
      prismaMock.$transaction = jest.fn((cb: any) => cb(prismaMock));
      prismaMock.transaction.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.wallet.update.mockResolvedValue({});

      const res = await request(app.getHttpServer())
        .post("/api/v1/payments/webhook")
        .set("x-paystack-signature", signature)
        .set("Content-Type", "application/json")
        .send(body);

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);
    });

    it("should ignore unknown event types", async () => {
      const { rawBody, signature, body } = makeSignedBody({
        event: "some.unknown.event",
        data: { reference: "ref_123" },
      });

      const res = await request(app.getHttpServer())
        .post("/api/v1/payments/webhook")
        .set("x-paystack-signature", signature)
        .set("Content-Type", "application/json")
        .send(body);

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);
    });
  });
});
