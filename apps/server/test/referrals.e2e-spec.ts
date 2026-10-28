import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { setupTestApp, MOCK_USER, createAuthenticatedRequest } from "./helpers";

describe("Referrals (e2e)", () => {
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

  describe("POST /api/v1/referrals/generate", () => {
    it("should generate a referral code", async () => {
      prismaMock.referral.create.mockResolvedValue({
        id: "ref1",
        userId: MOCK_USER.id,
        code: "BEXABC123",
        uses: 0,
      });

      const res = await createAuthenticatedRequest(app, prismaMock).post(
        "/api/v1/referrals/generate"
      );

      expect(res.status).toBe(201);
      expect(res.body.code).toBeDefined();
    });
  });

  describe("GET /api/v1/referrals", () => {
    it("should list referrals", async () => {
      prismaMock.referral.findMany.mockResolvedValue([
        { id: "ref1", userId: MOCK_USER.id, code: "BEXABC123", uses: 2 },
      ]);

      const res = await createAuthenticatedRequest(app, prismaMock).get("/api/v1/referrals");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  describe("POST /api/v1/referrals/apply", () => {
    it("should apply a referral code", async () => {
      prismaMock.referral.findUnique.mockResolvedValue({
        id: "ref1",
        userId: "u2",
        code: "BEXABC123",
        uses: 0,
      });
      prismaMock.referredUser.create.mockResolvedValue({});

      const res = await createAuthenticatedRequest(app, prismaMock).post("/api/v1/referrals/apply");

      expect(res.status).toBe(201);
    });
  });
});
