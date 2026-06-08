import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { setupTestApp, MOCK_USER, createAuthenticatedRequest } from "./helpers";

describe("Cart (e2e)", () => {
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

  const cartWithItem = {
    id: "c1",
    userId: MOCK_USER.id,
    items: [
      {
        id: "ci1",
        cartId: "c1",
        productId: mockProduct.id,
        productName: mockProduct.name,
        price: mockProduct.price,
        quantity: 2,
        product: {
          stock: mockProduct.stock,
          vendor: mockProduct.vendor,
          images: mockProduct.images,
        },
      },
    ],
  };

  const emptyCart = { id: "c1", userId: MOCK_USER.id, items: [] };

  describe("GET /api/v1/cart", () => {
    it("should return empty cart for new user", async () => {
      prismaMock.cart.findUnique.mockResolvedValue(null);
      prismaMock.cart.create.mockResolvedValue(emptyCart);

      const res = await createAuthenticatedRequest(app, prismaMock).get("/api/v1/cart");

      expect(res.status).toBe(200);
      expect(res.body.items).toEqual([]);
      expect(res.body.itemCount).toBe(0);
      expect(res.body.subtotal).toBe(0);
    });

    it("should return cart with items after adding", async () => {
      prismaMock.cart.findUnique.mockResolvedValue(cartWithItem);

      const res = await createAuthenticatedRequest(app, prismaMock).get("/api/v1/cart");

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].productId).toBe("p1");
      expect(res.body.items[0].quantity).toBe(2);
      expect(res.body.itemCount).toBe(2);
      expect(res.body.subtotal).toBe(200);
    });

    it("should return 401 without auth", async () => {
      const res = await request(app.getHttpServer()).get("/api/v1/cart");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/v1/cart", () => {
    it("should add item to cart", async () => {
      prismaMock.product.findUnique.mockResolvedValue(mockProduct);
      prismaMock.cart.findUnique.mockResolvedValue(null);
      prismaMock.cart.create.mockResolvedValue(emptyCart);
      prismaMock.cartItem.create.mockResolvedValue({ id: "ci1" });

      const res = await createAuthenticatedRequest(app, prismaMock)
        .post("/api/v1/cart")
        .send({ productId: "p1", quantity: 2 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe("PUT /api/v1/cart/:id", () => {
    it("should update cart item quantity", async () => {
      prismaMock.cart.findUnique.mockResolvedValue(cartWithItem);
      prismaMock.product.findUnique.mockResolvedValue(mockProduct);
      prismaMock.cartItem.update.mockResolvedValue({ id: "ci1", quantity: 3 });

      const res = await createAuthenticatedRequest(app, prismaMock)
        .put("/api/v1/cart/ci1")
        .send({ quantity: 3 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("DELETE /api/v1/cart/:id", () => {
    it("should remove item from cart", async () => {
      prismaMock.cart.findUnique.mockResolvedValue(cartWithItem);
      prismaMock.cartItem.delete.mockResolvedValue({ id: "ci1" });

      const res = await createAuthenticatedRequest(app, prismaMock).delete("/api/v1/cart/ci1");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
