import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { setupTestApp, MOCK_USER, createAuthenticatedRequest } from "./helpers";

describe("Notifications (e2e)", () => {
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

  describe("GET /api/v1/notifications", () => {
    it("should list notifications", async () => {
      prismaMock.notification.findMany.mockResolvedValue([
        {
          id: "n1",
          userId: MOCK_USER.id,
          title: "Order Confirmed",
          body: "Your order has been confirmed.",
          read: false,
          createdAt: new Date(),
        },
      ]);

      const res = await createAuthenticatedRequest(app, prismaMock).get("/api/v1/notifications");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  describe("GET /api/v1/notifications/unread-count", () => {
    it("should get unread count", async () => {
      prismaMock.notification.count.mockResolvedValue(3);

      const res = await createAuthenticatedRequest(app, prismaMock).get(
        "/api/v1/notifications/unread-count"
      );

      expect(res.status).toBe(200);
      expect(res.body.unreadCount).toBe(3);
    });
  });

  describe("POST /api/v1/notifications/:id/read", () => {
    it("should mark notification as read", async () => {
      prismaMock.notification.findUnique.mockResolvedValue({
        id: "n1",
        userId: MOCK_USER.id,
        read: false,
      });
      prismaMock.notification.update.mockResolvedValue({
        id: "n1",
        read: true,
      });

      const res = await createAuthenticatedRequest(app, prismaMock).post(
        "/api/v1/notifications/n1/read"
      );

      expect(res.status).toBe(200);
      expect(res.body.read).toBe(true);
    });
  });
});
