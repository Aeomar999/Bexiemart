import { twoFactorApi } from "./two-factor";
import { apiClient } from "./client";
import { authClient } from "./better-auth";

jest.mock("./client", () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

jest.mock("./better-auth", () => ({
  authClient: {
    getSession: jest.fn(),
  },
}));

describe("twoFactorApi", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should get status from authClient session", async () => {
    (authClient.getSession as jest.Mock).mockResolvedValue({
      data: { user: { id: "u1", twoFactorEnabled: true } },
    });
    const status = await twoFactorApi.getStatus();
    expect(status.twoFactorEnabled).toBe(true);
  });

  it("should post to enable", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({
      data: { totpURI: "otpauth://...", backupCodes: ["123", "456"] },
    });
    const res = await twoFactorApi.enable("password123");
    expect(apiClient.post).toHaveBeenCalledWith("/auth/two-factor/enable", {
      password: "password123",
    });
    expect(res.data.totpURI).toBe("otpauth://...");
  });

  it("should post to verifyTotp", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { success: true } });
    await twoFactorApi.verifyTotp("123456");
    expect(apiClient.post).toHaveBeenCalledWith("/auth/two-factor/verify-totp", { code: "123456" });
  });

  it("should post to disable", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { success: true } });
    await twoFactorApi.disable("password123");
    expect(apiClient.post).toHaveBeenCalledWith("/auth/two-factor/disable", {
      password: "password123",
    });
  });

  it("should post to generateBackupCodes", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { backupCodes: ["111", "222"] } });
    await twoFactorApi.generateBackupCodes("password123");
    expect(apiClient.post).toHaveBeenCalledWith("/auth/two-factor/generate-backup-codes", {
      password: "password123",
    });
  });
});
