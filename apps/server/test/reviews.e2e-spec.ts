import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { setupTestApp, MOCK_USER, createAuthenticatedRequest } from "./helpers";

describe("Reviews (e2e)", () => {
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

  const mockReview = {
    id: "r1",
    productId: "p1",
    userId: MOCK_USER.id,
    rating: 5,
    comment: "Great product!",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("POST /api/v1/reviews", () => {
    it("should create a review", async () => {
      prismaMock.product.findFirst.mockResolvedValue({
        id: "p1",
        name: "Test Product",
        isActive: true,
        isDeleted: false,
      });
      prismaMock.review.upsert.mockResolvedValue(mockReview);

      const res = await createAuthenticatedRequest(app, prismaMock)
        .post("/api/v1/reviews")
        .send({ productId: "p1", rating: 5, comment: "Great product!" });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe("r1");
      expect(res.body.rating).toBe(5);
    });
  });

  describe("GET /api/v1/reviews/product/:productId", () => {
    it("should list reviews for a product", async () => {
      prismaMock.review.findMany.mockResolvedValue([mockReview]);

      const res = await createAuthenticatedRequest(app, prismaMock).get(
        "/api/v1/reviews/product/p1"
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  describe("DELETE /api/v1/reviews/:id", () => {
    it("should delete a review", async () => {
      prismaMock.review.findFirst.mockResolvedValue(mockReview);
      prismaMock.review.delete.mockResolvedValue(mockReview);

      const res = await createAuthenticatedRequest(app, prismaMock).delete("/api/v1/reviews/r1");

      expect(res.status).toBe(200);
    });
  });
});
