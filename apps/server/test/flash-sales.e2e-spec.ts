import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { setupTestApp, MOCK_USER, createAuthenticatedRequest } from "./helpers";

describe("FlashSales (e2e)", () => {
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

  const mockFlashSale = {
    id: "fs1",
    name: "Flash Sale",
    discountPercent: 50,
    startDate: new Date(Date.now() - 3600000),
    endDate: new Date(Date.now() + 86400000),
    isActive: true,
    maxUses: 100,
    usedCount: 0,
  };

  describe("GET /api/v1/flash-sales/active", () => {
    it("should list active flash sales", async () => {
      prismaMock.flashSale.findMany.mockResolvedValue([mockFlashSale]);

      const res = await createAuthenticatedRequest(app, prismaMock).get(
        "/api/v1/flash-sales/active"
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe("fs1");
    });
  });
});
