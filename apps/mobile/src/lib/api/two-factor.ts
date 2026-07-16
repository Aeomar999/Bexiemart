import { apiClient } from "./client";
import { authClient } from "./better-auth";

export interface TwoFactorEnableResponse {
  totpURI: string;
  backupCodes: string[];
}

export const twoFactorApi = {
  getStatus: async () => {
    const session = await authClient.getSession();
    return {
      twoFactorEnabled: !!(session.data?.user as any)?.twoFactorEnabled,
    };
  },
  enable: (password: string) =>
    apiClient.post<TwoFactorEnableResponse>("/auth/two-factor/enable", { password }),
  verifyTotp: (code: string) => apiClient.post("/auth/two-factor/verify-totp", { code }),
  disable: (password: string) => apiClient.post("/auth/two-factor/disable", { password }),
  generateBackupCodes: (password: string) =>
    apiClient.post<{ backupCodes: string[] }>("/auth/two-factor/generate-backup-codes", {
      password,
    }),
};
