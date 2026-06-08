jest.mock("better-auth/client", () => ({
  createAuthClient: jest.fn(() => ({
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
  })),
}));
jest.mock("better-auth/client/plugins", () => ({
  phoneNumberClient: jest.fn(() => "phoneNumberClient"),
}));
jest.mock("@better-auth/infra/native", () => ({
  dashClient: jest.fn(() => "dashClient"),
  sentinelNativeClient: jest.fn((opts: any) => ({ ...opts, name: "sentinelNativeClient" })),
}));
jest.mock("../../config", () => ({ ENV: { API_URL: "http://test.com/api/v1" } }));
jest.mock("expo-secure-store", () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn() }));
jest.mock("react-native", () => ({ Platform: { OS: "ios" } }));

import { authClient } from "./better-auth";
import { createAuthClient } from "better-auth/client";
import * as SecureStore from "expo-secure-store";

const createAuthClientMock = createAuthClient as jest.Mock;
const createCall = createAuthClientMock.mock.calls[0][0];

describe("better-auth", () => {
  it("should create auth client", () => {
    expect(authClient).toBeDefined();
  });

  it("should configure baseURL with /auth suffix", () => {
    expect(createCall).toEqual(
      expect.objectContaining({ baseURL: "http://test.com/api/v1/auth" })
    );
  });

  it("should include phoneNumberClient plugin", () => {
    expect(createCall.plugins[0]).toBe("phoneNumberClient");
  });

  it("should include dashClient plugin", () => {
    expect(createCall.plugins[1]).toBe("dashClient");
  });

  it("should include sentinelNativeClient plugin", () => {
    expect(createCall.plugins[2].name).toBe("sentinelNativeClient");
  });

  it("should use SecureStore for native storage", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("stored-value");
    const sentinelOptions = jest.requireMock("@better-auth/infra/native").sentinelNativeClient.mock.calls[0][0];
    const result = await sentinelOptions.storage.getItem("test-key");
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith("test-key");
    expect(result).toBe("stored-value");
  });
});
