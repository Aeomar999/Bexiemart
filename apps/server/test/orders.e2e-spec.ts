import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { setupTestApp, MOCK_USER, createAuthenticatedRequest } from "./helpers";

describe("Orders (e2e)", () => {
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

  const mockProduct = {
    id: "p1",
    name: "Test Product",
    price: 100,
    stock: 10,
    isActive: true,
    isDeleted: false,
    vendor: { id: "v1", shopName: "Test Shop" },
    images: [{ url: "https://example.com/img.jpg", order: 0 }],
  };

  const mockShippingAddress = {
    id: "sa1",
    userId: MOCK_USER.id,
    firstName: "John",
    lastName: "Doe",
    phone: "0240000000",
    email: "john@example.com",
    address: "123 Main St",
    city: "Accra",
    state: "Greater Accra",
  };

  const mockOrder = {
    id: "o1",
    orderNumber: "BEX-ABC123-XYZ",
    userId: MOCK_USER.id,
    status: "pending",
    subtotal: 200,
    shippingFee: 500,
    tax: 15,
    total: 715,
    shippingAddressId: mockShippingAddress.id,
    shippingAddress: mockShippingAddress,
    items: [
      {
        id: "oi1",
        orderId: "o1",
        productId: mockProduct.id,
        productName: mockProduct.name,
        price: mockProduct.price,
        quantity: 2,
        total: 200,
        imageUrl: "https://example.com/img.jpg",
        product: {
          ...mockProduct,
        },
      },
    ],
    payment: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("POST /api/v1/orders", () => {
    it("should create order", async () => {
      prismaMock.product.findUnique.mockResolvedValue(mockProduct);
      prismaMock.$transaction = jest.fn((cb: any) => cb(prismaMock));
      prismaMock.shippingAddress.create.mockResolvedValue(mockShippingAddress);
      prismaMock.order.create.mockResolvedValue(mockOrder);
      prismaMock.product.update.mockResolvedValue(mockProduct);

      const res = await createAuthenticatedRequest(app, prismaMock)
        .post("/api/v1/orders")
        .send({
          shippingAddress: {
            firstName: "John",
            lastName: "Doe",
            phone: "0240000000",
            email: "john@example.com",
            address: "123 Main St",
            city: "Accra",
            state: "Greater Accra",
          },
          items: [{ productId: "p1", quantity: 2, price: 100 }],
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.orderNumber).toContain("BEX-");
      expect(res.body.total).toBeDefined();
      expect(res.body.items).toHaveLength(1);
    });

    it("should return 400 with invalid data", async () => {
      const res = await createAuthenticatedRequest(app, prismaMock).post("/api/v1/orders").send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/orders", () => {
    it("should list user orders", async () => {
      prismaMock.order.findMany.mockResolvedValue([mockOrder]);
      prismaMock.order.count.mockResolvedValue(1);

      const res = await createAuthenticatedRequest(app, prismaMock).get("/api/v1/orders");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.total).toBe(1);
      expect(res.body.meta.page).toBe(1);
    });
  });

  describe("GET /api/v1/orders/:id", () => {
    it("should get order by id", async () => {
      prismaMock.order.findFirst.mockResolvedValue(mockOrder);

      const res = await createAuthenticatedRequest(app, prismaMock).get("/api/v1/orders/o1");

      expect(res.status).toBe(200);
      expect(res.body.id).toBe("o1");
      expect(res.body.orderNumber).toContain("BEX-");
    });
  });

  describe("POST /api/v1/orders/:id/cancel", () => {
    it("should cancel order", async () => {
      prismaMock.order.findFirst.mockResolvedValue({
        ...mockOrder,
        status: "pending",
        items: mockOrder.items,
      });
      prismaMock.$transaction = jest.fn((cb: any) => cb(prismaMock));
      prismaMock.order.update.mockResolvedValue({ ...mockOrder, status: "cancelled" });
      prismaMock.product.update.mockResolvedValue(mockProduct);

      const res = await createAuthenticatedRequest(app, prismaMock).post(
        "/api/v1/orders/o1/cancel"
      );

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("cancelled");
    });
  });

  describe("POST /api/v1/orders/:id/request-refund", () => {
    it("should request refund", async () => {
      prismaMock.order.findFirst.mockResolvedValue({
        ...mockOrder,
        status: "delivered",
        items: mockOrder.items,
      });
      prismaMock.order.update.mockResolvedValue({
        ...mockOrder,
        status: "refund_requested",
      });

      const res = await createAuthenticatedRequest(app, prismaMock)
        .post("/api/v1/orders/o1/request-refund")
        .send({ reason: "Item arrived damaged and is not functioning as expected." });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("refund_requested");
    });
  });
});
