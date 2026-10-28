import { apiClient } from "./client";
import { login, getMe, updateProfile, updatePassword, uploadFile } from "./auth";

jest.mock("./client", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

global.fetch = jest.fn();

describe("auth API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("should login with email and password", async () => {
      const mockData = { user: { id: "u1", email: "admin@test.com" } };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockData),
      });

      const result = await login({ email: "admin@test.com", password: "password123" });

      expect(fetch).toHaveBeenCalledWith("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@test.com", password: "password123" }),
      });
      expect(result).toEqual(mockData);
    });

    it("should throw on login failure", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue({ message: "Invalid credentials" }),
      });

      await expect(
        login({ email: "bad@test.com", password: "wrong" })
      ).rejects.toThrow("Invalid credentials");
    });
  });

  describe("getMe", () => {
    it("should get current user", async () => {
      const mockData = { id: "u1", email: "admin@test.com", role: "ADMIN" };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await getMe();

      expect(apiClient.get).toHaveBeenCalledWith("/users/me");
      expect(result).toEqual(mockData);
    });
  });

  describe("updateProfile", () => {
    it("should update profile", async () => {
      const mockData = { id: "u1", name: "Updated Name" };
      (apiClient.patch as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await updateProfile({ name: "Updated Name" });

      expect(apiClient.patch).toHaveBeenCalledWith("/users/profile", {
        name: "Updated Name",
      });
      expect(result).toEqual(mockData);
    });
  });

  describe("updatePassword", () => {
    it("should update password", async () => {
      const mockData = { success: true };
      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await updatePassword({
        currentPassword: "old123",
        newPassword: "new123",
      });

      expect(apiClient.post).toHaveBeenCalledWith("/auth/change-password", {
        currentPassword: "old123",
        newPassword: "new123",
        revokeOtherSessions: true,
      });
      expect(result).toEqual(mockData);
    });
  });

  describe("uploadFile", () => {
    it("should upload a file", async () => {
      const mockData = { url: "https://cdn.example.com/file.jpg" };
      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockData });

      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const result = await uploadFile(file);

      expect(apiClient.post).toHaveBeenCalledWith(
        "/upload",
        expect.any(FormData),
        expect.objectContaining({ headers: { "Content-Type": "multipart/form-data" } })
      );
      expect(result).toEqual(mockData);
    });

    it("should reject unsupported file type", async () => {
      const file = new File(["test"], "test.exe", { type: "application/exe" });

      await expect(uploadFile(file)).rejects.toThrow(
        "Unsupported image type. Use JPG, PNG, WebP or HEIC."
      );
    });

    it("should reject oversized file", async () => {
      const file = new File(["x".repeat(11 * 1024 * 1024)], "large.jpg", {
        type: "image/jpeg",
      });

      await expect(uploadFile(file)).rejects.toThrow(
        "Image is too large. Maximum size is 10MB."
      );
    });
  });
});
