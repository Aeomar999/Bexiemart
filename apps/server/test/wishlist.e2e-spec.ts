import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { setupTestApp, MOCK_USER, createAuthenticatedRequest } from "./helpers";

describe("Wishlist (e2e)", () => {
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

  describe("GET /api/v1/wishlist", () => {
    it("should list wishlist items", async () => {
      prismaMock.wishlist.findMany.mockResolvedValue({
        data: [{ id: "w1", productId: "p1", userId: MOCK_USER.id }],
        meta: { total: 1 },
      });

      const res = await createAuthenticatedRequest(app, prismaMock).get("/api/v1/wishlist");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe("POST /api/v1/wishlist/:productId/toggle", () => {
    it("should toggle wishlist item", async () => {
      prismaMock.wishlist.findUnique.mockResolvedValue(null);
      prismaMock.wishlist.create.mockResolvedValue({
        id: "w1",
        productId: "p1",
        userId: MOCK_USER.id,
      });

      const res = await createAuthenticatedRequest(app, prismaMock).post(
        "/api/v1/wishlist/p1/toggle"
      );

      expect(res.status).toBe(200);
    });
  });
});
