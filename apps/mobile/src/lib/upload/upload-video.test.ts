import { uploadVideoToCloudinary } from "./upload-video";
import { apiClient } from "../api/client";

jest.mock("../api/client", () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

describe("uploadVideoToCloudinary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("uploads video and returns videoUrl and thumbnailUrl", async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: {
        api_key: "key-123",
        timestamp: 123456789,
        signature: "sig-abc",
        folder: "reels",
        eager: "sp_auto/mp4",
        eager_async: 1,
        cloud_name: "test-cloud",
      },
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        secure_url: "https://res.cloudinary.com/test-cloud/video/upload/v1234/reels/my-clip.mp4",
      }),
    });

    const result = await uploadVideoToCloudinary("file:///local/path/clip.mp4");
    expect(result).toEqual({
      videoUrl: "https://res.cloudinary.com/test-cloud/video/upload/v1234/reels/my-clip.mp4",
      thumbnailUrl: "https://res.cloudinary.com/test-cloud/video/upload/v1234/reels/my-clip.jpg",
    });
  });

  it("throws error when upload fails", async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: {
        api_key: "key-123",
        timestamp: 123456789,
        signature: "sig-abc",
        folder: "reels",
        eager: "sp_auto/mp4",
        eager_async: 1,
        cloud_name: "test-cloud",
      },
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: { message: "Cloudinary rejected file" },
      }),
    });

    await expect(uploadVideoToCloudinary("file:///local/path/clip.mp4")).rejects.toThrow(
      "Cloudinary rejected file"
    );
  });
});
