import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { setupTestApp, MOCK_USER, createAuthenticatedRequest } from "./helpers";

describe("Coupons (e2e)", () => {
  let app: INestApplication;
  let prismaMock: any;

  beforeAll(async () => {
    const test = await setupTestApp();
    app = test.app;
    prismaMock = test.prismaMock;
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /api/v1/coupons/validate", () => {
    it("should validate a coupon code", async () => {
      prismaMock.coupon.findUnique.mockResolvedValue({
        id: "c1",
        code: "SAVE20",
        discountPercent: 20,
        maxUses: 100,
        usedCount: 0,
        expiresAt: new Date(Date.now() + 86400000),
        isActive: true,
      });

      const res = await createAuthenticatedRequest(app, prismaMock)
        .post("/api/v1/coupons/validate")
        .send({ code: "SAVE20", orderAmount: 1000 });

      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
      expect(res.body.discountAmount).toBe(200);
    });

    it("should return invalid for unknown coupon", async () => {
      prismaMock.coupon.findUnique.mockResolvedValue(null);

      const res = await createAuthenticatedRequest(app, prismaMock)
        .post("/api/v1/coupons/validate")
        .send({ code: "INVALID", orderAmount: 1000 });

      expect(res.status).toBe(400);
    });
  });
});
