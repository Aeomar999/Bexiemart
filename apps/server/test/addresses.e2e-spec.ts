import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { setupTestApp, MOCK_USER, createAuthenticatedRequest } from "./helpers";

describe("Addresses (e2e)", () => {
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

  const mockAddress = {
    id: "a1",
    userId: MOCK_USER.id,
    type: "home",
    name: "Home",
    address: "123 Main St",
    city: "Accra",
    phone: "0240000000",
    isDefault: true,
  };

  describe("GET /api/v1/addresses", () => {
    it("should list addresses", async () => {
      prismaMock.userAddress.findMany.mockResolvedValue([mockAddress]);

      const res = await createAuthenticatedRequest(app, prismaMock).get("/api/v1/addresses");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  describe("POST /api/v1/addresses", () => {
    it("should create an address", async () => {
      prismaMock.userAddress.create.mockResolvedValue(mockAddress);

      const res = await createAuthenticatedRequest(app, prismaMock).post("/api/v1/addresses").send({
        type: "home",
        name: "Home",
        address: "123 Main St",
        city: "Accra",
        phone: "0240000000",
        isDefault: true,
      });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe("a1");
    });
  });

  describe("PATCH /api/v1/addresses/:id/default", () => {
    it("should set default address", async () => {
      prismaMock.userAddress.findUnique.mockResolvedValue({
        ...mockAddress,
        userId: MOCK_USER.id,
      });
      prismaMock.userAddress.update.mockResolvedValue(mockAddress);

      const res = await createAuthenticatedRequest(app, prismaMock).patch(
        "/api/v1/addresses/a1/default"
      );

      expect(res.status).toBe(200);
    });
  });
});
