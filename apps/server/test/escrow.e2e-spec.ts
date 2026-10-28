import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { setupTestApp, MOCK_USER, createAuthenticatedRequest } from "./helpers";

describe("Escrow (e2e)", () => {
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

  const mockEscrow = {
    id: "e1",
    orderId: "o1",
    vendorId: MOCK_USER.id,
    buyerWalletId: "w1",
    amount: 500,
    commission: 25,
    netAmount: 475,
    status: "HELD",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("GET /api/v1/escrow", () => {
    it("should list escrows", async () => {
      prismaMock.escrow.findMany.mockResolvedValue([mockEscrow]);
      prismaMock.escrow.count.mockResolvedValue(1);

      const res = await createAuthenticatedRequest(app, prismaMock).get("/api/v1/escrow");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.total).toBe(1);
    });
  });

  describe("GET /api/v1/escrow/:id", () => {
    it("should get escrow by id", async () => {
      prismaMock.escrow.findUnique.mockResolvedValue(mockEscrow);

      const res = await createAuthenticatedRequest(app, prismaMock).get("/api/v1/escrow/e1");

      expect(res.status).toBe(200);
      expect(res.body.id).toBe("e1");
      expect(res.body.status).toBe("HELD");
    });

    it("should return 404 when not found", async () => {
      prismaMock.escrow.findUnique.mockResolvedValue(null);

      const res = await createAuthenticatedRequest(app, prismaMock).get(
        "/api/v1/escrow/nonexistent"
      );

      expect(res.status).toBe(404);
    });
  });
});
