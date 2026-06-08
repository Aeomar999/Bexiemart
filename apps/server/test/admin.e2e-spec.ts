import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { setupTestApp, MOCK_USER, createAuthenticatedRequest } from "./helpers";

describe("Admin (e2e)", () => {
  let app: INestApplication;
  let prismaMock: any;
  let authMock: any;

  beforeAll(async () => {
    const test = await setupTestApp();
    app = test.app;
    prismaMock = test.prismaMock;
    authMock = test.authMock;
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /api/v1/admin/users", () => {
    it("should list users", async () => {
      prismaMock.user.findMany.mockResolvedValue([
        {
          id: "u1",
          name: "Alice",
          email: "alice@example.com",
          role: "CUSTOMER",
          phoneNumber: "0240000001",
          vendorProfile: null,
        },
        {
          id: "u2",
          name: "Bob",
          email: "bob@example.com",
          role: "VENDOR",
          phoneNumber: "0240000002",
          vendorProfile: { id: "vp1", shopName: "Bob Shop" },
        },
      ]);
      prismaMock.user.count.mockResolvedValue(2);

      const res = await createAuthenticatedRequest(app, prismaMock, { role: "ADMIN" }).get(
        "/api/v1/admin/users"
      );

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta.total).toBe(2);
    });
  });

  describe("PATCH /api/v1/admin/users/:id/role", () => {
    it("should update user role", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: "u2",
        email: "bob@example.com",
        name: "Bob",
        role: "CUSTOMER",
        phoneNumber: "0240000002",
      });
      prismaMock.user.update.mockResolvedValue({
        id: "u2",
        email: "bob@example.com",
        name: "Bob",
        role: "VENDOR",
        phoneNumber: "0240000002",
      });

      const res = await createAuthenticatedRequest(app, prismaMock, { role: "ADMIN" })
        .patch("/api/v1/admin/users/u2/role")
        .send({ role: "VENDOR" });

      expect(res.status).toBe(200);
      expect(res.body.role).toBe("VENDOR");
    });
  });

  describe("PATCH /api/v1/admin/vendors/:id/suspend", () => {
    it("should suspend a vendor", async () => {
      prismaMock.vendorProfile.findUnique.mockResolvedValue({
        id: "vp1",
        userId: "u1",
        shopName: "Test Shop",
        slug: "test-shop",
        status: "ACTIVE",
        isActive: true,
      });
      prismaMock.vendorProfile.update.mockResolvedValue({
        id: "vp1",
        userId: "u1",
        shopName: "Test Shop",
        slug: "test-shop",
        status: "ACTIVE",
        isActive: false,
      });

      const res = await createAuthenticatedRequest(app, prismaMock, { role: "ADMIN" }).patch(
        "/api/v1/admin/vendors/vp1/suspend"
      );

      expect(res.status).toBe(200);
      expect(res.body.isActive).toBe(false);
    });
  });

  describe("GET /api/v1/admin/dashboard", () => {
    it("should get dashboard stats", async () => {
      prismaMock.user.count.mockResolvedValue(100);
      prismaMock.vendorProfile.count.mockResolvedValue(15);
      prismaMock.order.count.mockResolvedValueOnce(500).mockResolvedValueOnce(30);
      prismaMock.escrow.aggregate = jest.fn().mockResolvedValue({ _sum: { commission: 25000 } });

      const res = await createAuthenticatedRequest(app, prismaMock, { role: "ADMIN" }).get(
        "/api/v1/admin/dashboard"
      );

      expect(res.status).toBe(200);
      expect(res.body.totalUsers).toBe(100);
      expect(res.body.totalVendors).toBe(15);
      expect(res.body.totalOrders).toBe(500);
      expect(res.body.pendingOrders).toBe(30);
      expect(res.body.totalRevenue).toBe(25000);
    });
  });
});
