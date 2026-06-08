import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { setupTestApp } from "./helpers";

describe("Products (e2e)", () => {
  let app: INestApplication;
  let prismaMock: any;

  const mockProduct = {
    id: "p1",
    name: "Test Product",
    slug: "test-product",
    description: "A test product description",
    price: 99.99,
    stock: 10,
    isFeatured: true,
    isActive: true,
    isDeleted: false,
    deliveryOptions: "DELIVERY",
    createdAt: new Date(),
    images: [{ id: "img1", url: "https://example.com/img.jpg", order: 0, isPrimary: true }],
    category: { id: "c1", name: "Electronics" },
    vendor: { id: "vp1", shopName: "Test Shop", logo: null, description: "A test shop" },
    reviews: [
      {
        id: "r1",
        rating: 5,
        comment: "Great product",
        createdAt: new Date(),
        user: { id: "u2", name: "John", image: null },
      },
    ],
  };

  const mockCategory = {
    id: "c1",
    name: "Electronics",
    slug: "electronics",
    icon: "icon-url",
    _count: { products: 10 },
  };

  const mockStore = {
    id: "vp1",
    shopName: "Test Shop",
    slug: "test-shop",
    description: "A test shop",
    logo: null,
    banner: null,
    address: "123 Test St",
    city: "Accra",
    state: "Greater Accra",
    phone: "0240000000",
    visits: 10,
    isActive: true,
  };

  beforeAll(async () => {
    const test = await setupTestApp();
    app = test.app;
    prismaMock = test.prismaMock;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/v1/products", () => {
    it("should list all products", async () => {
      prismaMock.product.findMany.mockResolvedValue([mockProduct]);
      prismaMock.product.count.mockResolvedValue(1);

      const res = await request(app.getHttpServer()).get("/api/v1/products");

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe("Test Product");
      expect(res.body.meta.total).toBe(1);
    });
  });

  describe("GET /api/v1/products/categories", () => {
    it("should return product categories", async () => {
      prismaMock.category.findMany.mockResolvedValue([mockCategory]);

      const res = await request(app.getHttpServer()).get("/api/v1/products/categories");

      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body[0].name).toBe("Electronics");
      expect(res.body[0].count).toBe(10);
    });
  });

  describe("GET /api/v1/products/featured", () => {
    it("should return featured products", async () => {
      prismaMock.product.findMany.mockResolvedValue([mockProduct]);

      const res = await request(app.getHttpServer()).get("/api/v1/products/featured");

      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body[0].name).toBe("Test Product");
    });
  });

  describe("GET /api/v1/products/search", () => {
    it("should search products by query", async () => {
      prismaMock.product.findMany.mockResolvedValue([mockProduct]);

      const res = await request(app.getHttpServer()).get("/api/v1/products/search?q=test");

      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body[0].name).toBe("Test Product");
    });

    it("should return empty array for empty search query", async () => {
      const res = await request(app.getHttpServer()).get("/api/v1/products/search?q=");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe("GET /api/v1/products/:id", () => {
    it("should return a product by ID", async () => {
      prismaMock.product.findUnique.mockResolvedValue(mockProduct);
      prismaMock.review.aggregate.mockResolvedValue({
        _avg: { rating: 4.5 },
        _count: 1,
      });

      const res = await request(app.getHttpServer()).get("/api/v1/products/p1");

      expect(res.status).toBe(200);
      expect(res.body.id).toBe("p1");
      expect(res.body.name).toBe("Test Product");
      expect(res.body.rating).toBe(4.5);
      expect(res.body.reviewCount).toBe(1);
    });

    it("should return 404 for non-existent product", async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);

      const res = await request(app.getHttpServer()).get("/api/v1/products/nonexistent");

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/v1/products/store/:id", () => {
    it("should return store by vendor ID", async () => {
      prismaMock.vendorProfile.findUnique.mockResolvedValue(mockStore);
      prismaMock.product.aggregate.mockResolvedValue({ _count: 5 });

      const res = await request(app.getHttpServer()).get("/api/v1/products/store/vp1");

      expect(res.status).toBe(200);
      expect(res.body.id).toBe("vp1");
      expect(res.body.name).toBe("Test Shop");
      expect(res.body.totalProducts).toBe(5);
    });
  });
});
