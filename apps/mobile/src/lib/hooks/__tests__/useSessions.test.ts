import { renderHook, waitFor } from "@testing-library/react-native";
import React from "react";
import {
  useSessions,
  useRevokeSession,
  useRevokeOtherSessions,
  parseDeviceLabel,
} from "../use-sessions";
import { sessionsApi } from "../../api/sessions";
import { createWrapper } from "./test-utils";

jest.mock("../../api/sessions", () => ({
  sessionsApi: {
    list: jest.fn(),
    revoke: jest.fn(),
    revokeOthers: jest.fn(),
  },
}));

describe("use-sessions hooks and utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("parseDeviceLabel", () => {
    it("returns friendly device name based on userAgent substring", () => {
      expect(parseDeviceLabel("Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)")).toBe(
        "iOS Device"
      );
      expect(parseDeviceLabel("Mozilla/5.0 (Linux; Android 13; SM-G998B)")).toBe("Android Device");
      expect(parseDeviceLabel("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")).toBe(
        "MacBook / Mac"
      );
      expect(parseDeviceLabel("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe("Windows PC");
      expect(parseDeviceLabel("Custom App Client v1")).toBe("Mobile / Web Device");
      expect(parseDeviceLabel(null)).toBe("Unknown Device");
    });
  });

  describe("useSessions", () => {
    it("fetches and returns session list", async () => {
      const mockSessions = [
        { id: "1", token: "tok1", userId: "u1", createdAt: "2026-07-01", expiresAt: "2026-08-01" },
      ];
      (sessionsApi.list as jest.Mock).mockResolvedValueOnce({ data: mockSessions });

      const { result } = renderHook(() => useSessions(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockSessions);
    });
  });

  describe("useRevokeSession", () => {
    it("calls sessionsApi.revoke with token", async () => {
      (sessionsApi.revoke as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

      const { result } = renderHook(() => useRevokeSession(), { wrapper: createWrapper() });
      result.current.mutate("tok-123");

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(sessionsApi.revoke).toHaveBeenCalledWith("tok-123");
    });
  });

  describe("useRevokeOtherSessions", () => {
    it("calls sessionsApi.revokeOthers", async () => {
      (sessionsApi.revokeOthers as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

      const { result } = renderHook(() => useRevokeOtherSessions(), { wrapper: createWrapper() });
      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(sessionsApi.revokeOthers).toHaveBeenCalled();
    });
  });
});
