jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
}));
jest.mock("../../config", () => ({ ENV: { API_URL: "http://test.com/api/v1" } }));
jest.mock("react-native", () => ({ Platform: { OS: "ios" } }));
jest.mock("../upload/prepare-image", () => ({
  prepareImageForUpload: jest.fn(async (file: any) => ({
    uri: "file:///processed.jpg",
    name: file.name.replace(/\.\w+$/, ".jpg"),
    type: "image/jpeg",
  })),
}));

import { uploadApi, uploadErrorMessage, UploadError } from "./upload";
import { prepareImageForUpload } from "../upload/prepare-image";
import * as SecureStore from "expo-secure-store";

// React Native's FormData keeps {uri, name, type} file parts as objects; the
// jest environment's stringifies them, so record appends instead.
class RecordingFormData {
  private entries = new Map<string, unknown>();
  append(key: string, value: unknown) {
    this.entries.set(key, value);
  }
  get(key: string) {
    return this.entries.has(key) ? this.entries.get(key) : null;
  }
}
(global as any).FormData = RecordingFormData;

const mockFetch = jest.fn();
global.fetch = mockFetch as any;

const heic = { uri: "file://IMG_1.HEIC", name: "IMG_1.HEIC", type: "image/heic" };
const jsonResponse = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(body),
});

describe("uploadApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("test-token");
  });

  describe("uploadFile", () => {
    it("preprocesses the image and posts it with the auth token", async () => {
      mockFetch.mockResolvedValue(jsonResponse(201, { url: "http://cdn.test/file.jpg" }));
      const result = await uploadApi.uploadFile(heic);

      expect(prepareImageForUpload).toHaveBeenCalledWith(heic);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("http://test.com/api/v1/upload");
      expect(init).toMatchObject({
        method: "POST",
        headers: { Authorization: "Bearer test-token" },
      });
      const sent = (init.body as FormData).get("file") as any;
      expect(sent).toMatchObject({
        uri: "file:///processed.jpg",
        name: "IMG_1.jpg",
        type: "image/jpeg",
      });
      expect(result.url).toBe("http://cdn.test/file.jpg");
    });

    it("surfaces the server's validation message", async () => {
      mockFetch.mockResolvedValue(
        jsonResponse(400, { message: "Unsupported image type. Use JPG, PNG, WebP or HEIC." })
      );
      await expect(uploadApi.uploadFile(heic)).rejects.toThrow(
        new UploadError("Unsupported image type. Use JPG, PNG, WebP or HEIC.")
      );
    });

    it("explains a 413 from the upload size limit", async () => {
      mockFetch.mockResolvedValue(jsonResponse(413, { message: "File too large" }));
      await expect(uploadApi.uploadFile(heic)).rejects.toThrow("That file is too large");
    });

    it("does not leak server-side error text on 5xx", async () => {
      mockFetch.mockResolvedValue(jsonResponse(502, { message: "Cloudinary exploded" }));
      await expect(uploadApi.uploadFile(heic)).rejects.toThrow("Upload failed. Please try again.");
    });

    it("reports connectivity problems clearly", async () => {
      mockFetch.mockRejectedValue(new TypeError("Network request failed"));
      await expect(uploadApi.uploadFile(heic)).rejects.toThrow("Unable to connect to the server");
    });

    it("falls back when the error body isn't JSON", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.reject(new Error()),
      });
      await expect(uploadApi.uploadFile(heic)).rejects.toThrow("Upload failed");
    });
  });

  describe("uploadDocument", () => {
    it("sends PDFs untouched to the document endpoint", async () => {
      mockFetch.mockResolvedValue(jsonResponse(201, { url: "http://cdn.test/doc.pdf" }));
      const pdf = { uri: "file://cert.pdf", name: "cert.pdf", type: "application/pdf" };
      await uploadApi.uploadDocument(pdf);

      expect(prepareImageForUpload).not.toHaveBeenCalled();
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("http://test.com/api/v1/upload/document");
      expect((init.body as FormData).get("file")).toMatchObject(pdf);
    });

    it("preprocesses photographed documents", async () => {
      mockFetch.mockResolvedValue(jsonResponse(201, { url: "http://cdn.test/doc.jpg" }));
      await uploadApi.uploadDocument(heic);
      expect(prepareImageForUpload).toHaveBeenCalledWith(heic);
    });
  });
});

describe("uploadErrorMessage", () => {
  it("passes UploadError messages through and hides anything else", () => {
    expect(uploadErrorMessage(new UploadError("Too big"), "fallback")).toBe("Too big");
    expect(uploadErrorMessage(new Error("SQL syntax near"), "fallback")).toBe("fallback");
  });
});
