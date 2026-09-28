jest.mock("./client", () => ({ apiClient: { post: jest.fn() } }));

import { apiClient } from "./client";
import { uploadFile, UploadError, UPLOAD_MAX_BYTES } from "./auth";

const post = apiClient.post as jest.Mock;
const image = (type: string, size = 1024) => new File([new Uint8Array(size)], "banner", { type });

describe("uploadFile", () => {
  beforeEach(() => post.mockReset());

  it.each(["image/jpeg", "image/png", "image/webp", "image/heic"])(
    "posts a %s to /upload as multipart",
    async (type) => {
      post.mockResolvedValue({ data: { url: "https://cdn/x.jpg" } });
      await expect(uploadFile(image(type))).resolves.toEqual({ url: "https://cdn/x.jpg" });

      const [path, body] = post.mock.calls[0];
      expect(path).toBe("/upload");
      expect(body).toBeInstanceOf(FormData);
      expect((body as FormData).get("file")).toBeInstanceOf(File);
    }
  );

  it("rejects unsupported types without calling the API", async () => {
    await expect(uploadFile(image("image/svg+xml"))).rejects.toThrow(
      new UploadError("Unsupported image type. Use JPG, PNG, WebP or HEIC.")
    );
    expect(post).not.toHaveBeenCalled();
  });

  it("rejects files over 10MB without calling the API", async () => {
    await expect(uploadFile(image("image/png", UPLOAD_MAX_BYTES + 1))).rejects.toThrow(
      "Image is too large. Maximum size is 10MB."
    );
    expect(post).not.toHaveBeenCalled();
  });

  it("surfaces the server's 400 message", async () => {
    post.mockRejectedValue({ response: { status: 400, data: { message: "Invalid image file" } } });
    await expect(uploadFile(image("image/png"))).rejects.toThrow(
      new UploadError("Invalid image file")
    );
  });

  it("explains a 413", async () => {
    post.mockRejectedValue({ response: { status: 413, data: { message: "File too large" } } });
    await expect(uploadFile(image("image/png"))).rejects.toBeInstanceOf(UploadError);
  });

  it("passes other failures through untouched", async () => {
    const outage = { response: { status: 502, data: { message: "Bad gateway" } } };
    post.mockRejectedValue(outage);
    await expect(uploadFile(image("image/png"))).rejects.toBe(outage);
  });
});
