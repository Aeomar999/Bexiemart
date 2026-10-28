import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { setupTestApp, MOCK_USER, createAuthenticatedRequest } from "./helpers";

describe("Story (e2e)", () => {
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

  const mockStory = {
    id: "s1",
    userId: MOCK_USER.id,
    mediaUrl: "https://example.com/story.jpg",
    mediaType: "image",
    expiresAt: new Date(Date.now() + 86400000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("GET /api/v1/story", () => {
    it("should list stories", async () => {
      prismaMock.story.findMany.mockResolvedValue([mockStory]);

      const res = await createAuthenticatedRequest(app, prismaMock).get("/api/v1/story");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  describe("POST /api/v1/story", () => {
    it("should create a story", async () => {
      prismaMock.story.create.mockResolvedValue(mockStory);

      const res = await createAuthenticatedRequest(app, prismaMock)
        .post("/api/v1/story")
        .send({ mediaUrl: "https://example.com/story.jpg", mediaType: "image" });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe("s1");
    });
  });

  describe("POST /api/v1/story/:id/view", () => {
    it("should record a story view", async () => {
      prismaMock.story.findUnique.mockResolvedValue(mockStory);
      prismaMock.storyView.create.mockResolvedValue({});

      const res = await createAuthenticatedRequest(app, prismaMock).post("/api/v1/story/s1/view");

      expect(res.status).toBe(201);
    });
  });

  describe("DELETE /api/v1/story/:id", () => {
    it("should delete a story", async () => {
      prismaMock.story.findUnique.mockResolvedValue(mockStory);
      prismaMock.story.delete.mockResolvedValue(mockStory);

      const res = await createAuthenticatedRequest(app, prismaMock).delete("/api/v1/story/s1");

      expect(res.status).toBe(200);
    });
  });
});
