import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { setupTestApp, MOCK_USER, createAuthenticatedRequest } from "./helpers";

describe("Auth (e2e)", () => {
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

  describe("POST /api/v1/auth/register", () => {
    it("should register a new user", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post("/api/v1/auth/register")
        .send({ email: "test@example.com", password: "password123", name: "Test User" });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe("test@example.com");
      expect(res.body.token).toBeDefined();
      expect(res.body.message).toBe("Registration successful");
    });

    it("should return 400 for invalid data", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/v1/auth/register")
        .send({ email: "not-an-email" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("should login with valid credentials", async () => {
      prismaMock.user.findUnique.mockResolvedValue(MOCK_USER);

      const res = await request(app.getHttpServer())
        .post("/api/v1/auth/login")
        .send({ email: "test@example.com", password: "password123" });

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.token).toBeDefined();
    });

    it("should return 401 for invalid credentials", async () => {
      authMock.api.signInEmail.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: "Invalid credentials" }),
        headers: new Map(),
      });

      const res = await request(app.getHttpServer())
        .post("/api/v1/auth/login")
        .send({ email: "test@example.com", password: "wrong-password" });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("should return current user when authenticated", async () => {
      prismaMock.user.findUnique.mockResolvedValue(MOCK_USER);

      const res = await createAuthenticatedRequest(app, prismaMock).get("/api/v1/auth/me");

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(MOCK_USER.email);
    });

    it("should return 401 without auth", async () => {
      const res = await request(app.getHttpServer()).get("/api/v1/auth/me");
      expect(res.status).toBe(401);
    });
  });
});
