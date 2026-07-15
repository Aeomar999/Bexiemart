import { renderHook, waitFor } from "@testing-library/react-native";
import React from "react";
import {
  useTwoFactorStatus,
  useEnableTwoFactor,
  useVerifyTotp,
  useDisableTwoFactor,
  useGenerateBackupCodes,
} from "../use-two-factor";
import { twoFactorApi } from "../../api/two-factor";
import { createWrapper } from "./test-utils";

jest.mock("../../api/two-factor", () => ({
  twoFactorApi: {
    getStatus: jest.fn(),
    enable: jest.fn(),
    verifyTotp: jest.fn(),
    disable: jest.fn(),
    generateBackupCodes: jest.fn(),
  },
}));

describe("use-two-factor hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("useTwoFactorStatus fetches status", async () => {
    (twoFactorApi.getStatus as jest.Mock).mockResolvedValue({ twoFactorEnabled: true });
    const { result } = renderHook(() => useTwoFactorStatus(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.twoFactorEnabled).toBe(true);
  });

  it("useEnableTwoFactor calls enable mutation", async () => {
    (twoFactorApi.enable as jest.Mock).mockResolvedValue({
      data: { totpURI: "uri", backupCodes: ["1", "2"] },
    });
    const { result } = renderHook(() => useEnableTwoFactor(), { wrapper: createWrapper() });

    result.current.mutate("password123");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(twoFactorApi.enable).toHaveBeenCalledWith("password123");
  });

  it("useVerifyTotp calls verifyTotp mutation", async () => {
    (twoFactorApi.verifyTotp as jest.Mock).mockResolvedValue({ data: { success: true } });
    const { result } = renderHook(() => useVerifyTotp(), { wrapper: createWrapper() });

    result.current.mutate("123456");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(twoFactorApi.verifyTotp).toHaveBeenCalledWith("123456");
  });

  it("useDisableTwoFactor calls disable mutation", async () => {
    (twoFactorApi.disable as jest.Mock).mockResolvedValue({ data: { success: true } });
    const { result } = renderHook(() => useDisableTwoFactor(), { wrapper: createWrapper() });

    result.current.mutate("password123");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(twoFactorApi.disable).toHaveBeenCalledWith("password123");
  });

  it("useGenerateBackupCodes calls generateBackupCodes mutation", async () => {
    (twoFactorApi.generateBackupCodes as jest.Mock).mockResolvedValue({
      data: { backupCodes: ["888", "999"] },
    });
    const { result } = renderHook(() => useGenerateBackupCodes(), { wrapper: createWrapper() });

    result.current.mutate("password123");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(twoFactorApi.generateBackupCodes).toHaveBeenCalledWith("password123");
  });
});
