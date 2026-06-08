import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  setupTestApp,
  MOCK_USER,
  MOCK_VENDOR_PROFILE,
  createAuthenticatedRequest,
} from "./helpers";

describe("Vendor (e2e)", () => {
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

  describe("POST /api/v1/vendor/onboarding", () => {
    it("should onboard a vendor", async () => {
      prismaMock.vendorProfile.findUnique
        .mockResolvedValueOnce(MOCK_VENDOR_PROFILE)
        .mockResolvedValueOnce(null);
      prismaMock.vendorProfile.update.mockResolvedValue({
        ...MOCK_VENDOR_PROFILE,
        shopName: "My Shop",
        slug: "my-shop",
        description: "Best shop ever",
        city: "Accra",
        phone: "0240000000",
      });

      const res = await createAuthenticatedRequest(app, prismaMock, { role: "VENDOR" })
        .post("/api/v1/vendor/onboarding")
        .send({
          shopName: "My Shop",
          slug: "my-shop",
          description: "Best shop ever",
          city: "Accra",
          phone: "0240000000",
        });

      expect(res.status).toBe(201);
      expect(res.body.shopName).toBe("My Shop");
      expect(res.body.slug).toBe("my-shop");
      expect(res.body.description).toBe("Best shop ever");
    });
  });

  describe("GET /api/v1/vendor/profile", () => {
    it("should get vendor profile", async () => {
      prismaMock.vendorProfile.findUnique.mockResolvedValue(MOCK_VENDOR_PROFILE);

      const res = await createAuthenticatedRequest(app, prismaMock, { role: "VENDOR" }).get(
        "/api/v1/vendor/profile"
      );

      expect(res.status).toBe(200);
      expect(res.body.shopName).toBe("Test Shop");
      expect(res.body.slug).toBe("test-shop");
      expect(res.body.status).toBe("ACTIVE");
    });
  });

  describe("POST /api/v1/vendor/products", () => {
    it("should create a product", async () => {
      prismaMock.vendorProfile.findUnique.mockResolvedValue(MOCK_VENDOR_PROFILE);
      prismaMock.product.create.mockResolvedValue({
        id: "p1",
        name: "Test Product",
        slug: "test-product",
        description: "A test product",
        price: 99.99,
        stock: 10,
        categoryId: "c1",
        vendorId: "vp1",
        images: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await createAuthenticatedRequest(app, prismaMock, { role: "VENDOR" })
        .post("/api/v1/vendor/products")
        .send({
          name: "Test Product",
          description: "A test product",
          price: 99.99,
          stock: 10,
          categoryId: "c1",
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Test Product");
      expect(res.body.price).toBe(99.99);
    });
  });

  describe("GET /api/v1/vendor/products", () => {
    it("should list vendor products", async () => {
      prismaMock.vendorProfile.findUnique.mockResolvedValue(MOCK_VENDOR_PROFILE);
      prismaMock.product.findMany.mockResolvedValue([
        {
          id: "p1",
          name: "Product 1",
          slug: "product-1",
          description: "First product",
          price: 50,
          stock: 5,
          vendorId: "vp1",
          categoryId: "c1",
          isDeleted: false,
          images: [],
          category: { id: "c1", name: "Category 1" },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "p2",
          name: "Product 2",
          slug: "product-2",
          description: "Second product",
          price: 75,
          stock: 3,
          vendorId: "vp1",
          categoryId: "c1",
          isDeleted: false,
          images: [],
          category: { id: "c1", name: "Category 1" },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      prismaMock.product.count.mockResolvedValue(2);

      const res = await createAuthenticatedRequest(app, prismaMock, { role: "VENDOR" }).get(
        "/api/v1/vendor/products"
      );

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta.total).toBe(2);
      expect(res.body.data[0].name).toBe("Product 1");
    });
  });

  describe("PUT /api/v1/vendor/products/:id", () => {
    it("should update a product", async () => {
      prismaMock.vendorProfile.findUnique.mockResolvedValue(MOCK_VENDOR_PROFILE);
      prismaMock.product.findFirst.mockResolvedValue({
        id: "p1",
        vendorId: "vp1",
      });
      prismaMock.product.update.mockResolvedValue({
        id: "p1",
        name: "Updated Product",
        slug: "product-1",
        description: "First product",
        price: 29.99,
        stock: 10,
        vendorId: "vp1",
        categoryId: "c1",
        images: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await createAuthenticatedRequest(app, prismaMock, { role: "VENDOR" })
        .put("/api/v1/vendor/products/p1")
        .send({ name: "Updated Product", price: 29.99 });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Updated Product");
      expect(res.body.price).toBe(29.99);
    });
  });

  describe("GET /api/v1/vendor/orders", () => {
    it("should list vendor orders", async () => {
      prismaMock.vendorProfile.findUnique.mockResolvedValue(MOCK_VENDOR_PROFILE);
      prismaMock.orderItem.findMany
        .mockResolvedValueOnce([{ orderId: "o1" }])
        .mockResolvedValueOnce([{ orderId: "o1" }])
        .mockResolvedValueOnce([
          {
            id: "oi1",
            orderId: "o1",
            productId: "p1",
            productName: "Product 1",
            quantity: 2,
            price: 50,
            total: 100,
            imageUrl: null,
            product: { id: "p1", name: "Product 1", images: [] },
            order: {
              id: "o1",
              orderNumber: "ORD-001",
              status: "pending",
              total: 100,
              createdAt: new Date(),
              shippingAddress: null,
              items: [],
            },
          },
        ]);

      const res = await createAuthenticatedRequest(app, prismaMock, { role: "VENDOR" }).get(
        "/api/v1/vendor/orders"
      );

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.total).toBe(1);
      expect(res.body.data[0].orderNumber).toBe("ORD-001");
      expect(res.body.data[0].status).toBe("pending");
    });
  });

  describe("GET /api/v1/vendor/earnings", () => {
    it("should get vendor earnings", async () => {
      prismaMock.vendorProfile.findUnique.mockResolvedValue({
        ...MOCK_VENDOR_PROFILE,
        pendingPayout: "200",
        totalEarnings: "1000",
      });
      prismaMock.wallet.findUnique.mockResolvedValue({
        id: "w1",
        userId: "u1",
        balance: "500",
        currency: "GHS",
      });
      prismaMock.transaction.findMany.mockResolvedValue([
        {
          id: "t1",
          reference: "REF-001",
          type: "EARNINGS",
          description: "Order Payment",
          createdAt: new Date(),
          amount: "150",
          status: "COMPLETED",
        },
        {
          id: "t2",
          reference: "REF-002",
          type: "WITHDRAWAL",
          description: "Bank Transfer",
          createdAt: new Date(Date.now() - 86400000),
          amount: "100",
          status: "COMPLETED",
        },
      ]);

      const res = await createAuthenticatedRequest(app, prismaMock, { role: "VENDOR" }).get(
        "/api/v1/vendor/earnings"
      );

      expect(res.status).toBe(200);
      expect(res.body.availableBalance).toBe(500);
      expect(res.body.pendingClearance).toBe(200);
      expect(res.body.recentTransactions).toHaveLength(2);
    });
  });

  describe("POST /api/v1/vendor/earnings/withdraw", () => {
    it("should withdraw earnings", async () => {
      prismaMock.vendorProfile.findUnique.mockResolvedValue({
        ...MOCK_VENDOR_PROFILE,
        pendingPayout: "500",
      });
      prismaMock.wallet.findUnique.mockResolvedValue({
        id: "w1",
        userId: "u1",
        balance: "500",
        currency: "GHS",
      });
      prismaMock.$transaction.mockResolvedValue([
        { id: "w1", balance: 300 },
        { id: "t1", type: "WITHDRAWAL", reference: "WD-123" },
        { id: "vp1", pendingPayout: 300 },
      ]);

      const res = await createAuthenticatedRequest(app, prismaMock, { role: "VENDOR" })
        .post("/api/v1/vendor/earnings/withdraw")
        .send({ amount: 200, destination: "Bank Account - 1234" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.reference).toBeDefined();
    });
  });
});
