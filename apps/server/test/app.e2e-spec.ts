import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe, VersioningType, RequestMethod } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { GlobalExceptionFilter } from "../src/filters/global-exception.filter";
import { AUTH } from "../src/auth/auth.constants";

describe("App (e2e)", () => {
  let app: INestApplication;
  let prismaMock: Record<string, any>;

  beforeAll(async () => {
    prismaMock = {
      $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
      $transaction: jest.fn((cb: any) => cb(prismaMock)),
      product: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
      user: { findUnique: jest.fn(), create: jest.fn() },
      session: { findUnique: jest.fn(), create: jest.fn() },
      cart: { findUnique: jest.fn(), create: jest.fn() },
      order: { findMany: jest.fn(), create: jest.fn() },
      payment: { create: jest.fn() },
      vendorProfile: { findUnique: jest.fn(), findFirst: jest.fn() },
      wallet: { findUnique: jest.fn() },
      wishlist: { findUnique: jest.fn() },
      address: { findMany: jest.fn() },
      review: { findMany: jest.fn() },
      coupon: { findMany: jest.fn() },
      vendorCoupon: { findMany: jest.fn() },
      service: { findMany: jest.fn() },
      reel: { findMany: jest.fn() },
      booking: { findMany: jest.fn() },
      staffMember: { findMany: jest.fn() },
      vendorCustomer: { findMany: jest.fn() },
      vendorPaymentMethod: { findMany: jest.fn() },
      businessHours: { findMany: jest.fn() },
      vendorDocument: { findMany: jest.fn() },
      flashSale: { findMany: jest.fn() },
      banner: { findMany: jest.fn() },
      referral: { findMany: jest.fn() },
      customerReel: { findMany: jest.fn() },
      customerService: { findMany: jest.fn() },
      restaurant: { findMany: jest.fn() },
      foodItem: { findMany: jest.fn() },
      escrowTransaction: { findMany: jest.fn() },
      conversation: { findMany: jest.fn() },
      supportTicket: { findMany: jest.fn() },
      deliveryPerson: { findUnique: jest.fn(), findMany: jest.fn() },
      deliveryTask: { findMany: jest.fn(), findUnique: jest.fn() },
      story: { findMany: jest.fn() },
      collection: { findMany: jest.fn() },
      loyaltyAccount: { findUnique: jest.fn() },
      notificationPreference: { findUnique: jest.fn() },
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
      .overrideProvider(AUTH)
      .useValue({ api: {}, handler: jest.fn() })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.setGlobalPrefix("api", {
      exclude: [
        { path: "health", method: RequestMethod.GET },
        { path: "api/health", method: RequestMethod.GET },
        { path: "api/v1/health", method: RequestMethod.GET },
      ],
    });
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

    it("GET /health should return ok", async () => {
      const res = await request(app.getHttpServer()).get("/health");
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
