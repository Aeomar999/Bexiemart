import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { setupTestApp, MOCK_USER, createAuthenticatedRequest } from "./helpers";

describe("Delivery (e2e)", () => {
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

  const mockQuote = {
    id: "dq1",
    distanceKm: 5.5,
    fee: 2500,
    currency: "GHS",
    estimatedDurationMinutes: 30,
  };

  describe("POST /api/v1/delivery/quote", () => {
    it("should get a delivery quote", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            routes: [{ distance: 5500, duration: 1800 }],
          }),
      });

      const res = await createAuthenticatedRequest(app, prismaMock)
        .post("/api/v1/delivery/quote")
        .send({
          origin: "Accra, Ghana",
          destination: "Kumasi, Ghana",
        });

      expect(res.status).toBe(201);
      expect(res.body.fee).toBeDefined();
    });
  });

  describe("POST /api/v1/delivery/jobs", () => {
    it("should create a delivery job", async () => {
      prismaMock.deliveryTask.create.mockResolvedValue({
        id: "dj1",
        orderId: "o1",
        status: "PENDING",
        fee: 2500,
      });

      const res = await createAuthenticatedRequest(app, prismaMock)
        .post("/api/v1/delivery/jobs")
        .send({ orderId: "o1" });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe("dj1");
    });
  });

  describe("GET /api/v1/delivery/jobs", () => {
    it("should list delivery jobs", async () => {
      prismaMock.deliveryTask.findMany.mockResolvedValue([
        { id: "dj1", orderId: "o1", status: "PENDING" },
      ]);

      const res = await createAuthenticatedRequest(app, prismaMock).get("/api/v1/delivery/jobs");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });
});
