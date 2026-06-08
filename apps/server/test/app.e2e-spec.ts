import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe, VersioningType } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { GlobalExceptionFilter } from "../src/filters/global-exception.filter";

describe("App (e2e)", () => {
  let app: INestApplication;
  let prismaMock: Record<string, any>;

  beforeAll(async () => {
    prismaMock = {
      $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
      $transaction: jest.fn((cb: any) => cb(prismaMock)),
      wallet: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation((d) => ({ id: "w1", ...d.data })),
        update: jest.fn().mockImplementation((d) => d.data),
      },
      transaction: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        update: jest.fn(),
      },
      product: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      cart: { findUnique: jest.fn(), create: jest.fn() },
      cartItem: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      order: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      orderItem: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn() },
      shippingAddress: { create: jest.fn() },
      escrow: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      vendorProfile: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
        create: jest.fn(),
      },
      referral: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn() },
      referredUser: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn() },
      conversation: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      conversationParticipant: { findMany: jest.fn(), updateMany: jest.fn() },
      message: { findMany: jest.fn(), create: jest.fn(), count: jest.fn() },
      platformConfig: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn() },
      category: { findUnique: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.setGlobalPrefix("api");
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Health", () => {
    it("GET /api/v1/health should return ok", async () => {
      const res = await request(app.getHttpServer()).get("/api/v1/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.database.status).toBe("healthy");
    });
  });

  describe("Products", () => {
    it("GET /api/v1/products should return list", async () => {
      const res = await request(app.getHttpServer()).get("/api/v1/products");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });
  });

  describe("Cart", () => {
    it("GET /api/v1/cart should return cart 401 without auth", async () => {
      const res = await request(app.getHttpServer()).get("/api/v1/cart");
      expect(res.status).toBe(401);
    });
  });
});
