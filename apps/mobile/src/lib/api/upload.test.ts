jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
}));
jest.mock("../../config", () => ({ ENV: { API_URL: "http://test.com/api/v1" } }));
jest.mock("react-native", () => ({ Platform: { OS: "ios" } }));

import { uploadApi } from "./upload";
import * as SecureStore from "expo-secure-store";

const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe("uploadApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should upload file successfully", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("test-token");
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ url: "http://cdn.test/file.jpg", filename: "file.jpg" }) });
    const result = await uploadApi.uploadFile({ uri: "file://photo.jpg", name: "photo.jpg", type: "image/jpeg" });
    expect(mockFetch).toHaveBeenCalledWith("http://test.com/api/v1/upload", expect.objectContaining({ method: "POST" }));
    expect(result.url).toBe("http://cdn.test/file.jpg");
  });

  it("should handle upload error", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("test-token");
    mockFetch.mockResolvedValue({ ok: false });
    await expect(uploadApi.uploadFile({ uri: "file://photo.jpg", name: "photo.jpg", type: "image/jpeg" })).rejects.toThrow("Upload failed");
  });
});
