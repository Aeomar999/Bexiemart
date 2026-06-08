jest.mock("./client", () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
  },
}));
jest.mock("./better-auth", () => ({
  authClient: {
    forgetPassword: jest.fn(),
    resetPassword: jest.fn(),
    verifyEmail: jest.fn(),
  },
}));

import { authApi } from "./auth";
import { apiClient } from "./client";
import { authClient } from "./better-auth";

describe("authApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should login with email and password", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { token: "abc" } });
    const result = await authApi.login({ email: "test@test.com", password: "pass123" });
    expect(apiClient.post).toHaveBeenCalledWith("/auth/login", { email: "test@test.com", password: "pass123" });
    expect(result.data.token).toBe("abc");
  });

  it("should register with user data", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: "1" } });
    const result = await authApi.register({ email: "test@test.com", password: "pass123", name: "Test", role: "USER" });
    expect(apiClient.post).toHaveBeenCalledWith("/auth/register", { email: "test@test.com", password: "pass123", name: "Test", role: "USER" });
    expect(result.data.id).toBe("1");
  });

  it("should get current user", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { id: "1", email: "test@test.com" } });
    const result = await authApi.getCurrentUser();
    expect(apiClient.get).toHaveBeenCalledWith("/auth/me");
    expect(result.data.email).toBe("test@test.com");
  });

  it("should send forgot password request via better-auth", async () => {
    (authClient.forgetPassword as jest.Mock).mockResolvedValue({ data: { success: true }, error: null });
    const result = await authApi.forgotPassword("test@test.com");
    expect(authClient.forgetPassword).toHaveBeenCalledWith({ email: "test@test.com", redirectTo: "bexiemart://reset-password" });
    expect(result.data.success).toBe(true);
  });

  it("should resend verification email", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { message: "Sent" } });
    const result = await authApi.resendVerificationEmail("test@test.com");
    expect(apiClient.post).toHaveBeenCalledWith("/auth/resend-verification", { email: "test@test.com" });
    expect(result.data.message).toBe("Sent");
  });

  it("should handle error on login", async () => {
    (apiClient.post as jest.Mock).mockRejectedValue(new Error("Invalid credentials"));
    await expect(authApi.login({ email: "test@test.com", password: "wrong" })).rejects.toThrow("Invalid credentials");
  });
});
