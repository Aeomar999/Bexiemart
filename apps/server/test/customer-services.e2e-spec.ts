import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { setupTestApp, MOCK_USER, createAuthenticatedRequest } from "./helpers";

describe("Customer Services (e2e)", () => {
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

  describe("GET /api/v1/services", () => {
    it("should list services", async () => {
      prismaMock.service.findMany.mockResolvedValue([
        {
          id: "svc1",
          name: "Plumbing",
          description: "Plumbing services",
          pricePerHour: 5000,
          isActive: true,
        },
      ]);

      const res = await createAuthenticatedRequest(app, prismaMock).get("/api/v1/services");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  describe("POST /api/v1/services/:id/book", () => {
    it("should book a service", async () => {
      prismaMock.service.findUnique.mockResolvedValue({
        id: "svc1",
        name: "Plumbing",
        pricePerHour: 5000,
      });
      prismaMock.serviceBooking.create.mockResolvedValue({
        id: "sb1",
        serviceId: "svc1",
        userId: MOCK_USER.id,
        status: "PENDING",
      });

      const res = await createAuthenticatedRequest(app, prismaMock).post(
        "/api/v1/services/svc1/book"
      );

      expect(res.status).toBe(201);
      expect(res.body.id).toBe("sb1");
    });
  });
});
