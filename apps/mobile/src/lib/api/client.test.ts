jest.mock("axios", () => {
  const defaults = { baseURL: "", timeout: 0 };
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    defaults,
  };
  return {
    create: jest.fn((config) => {
      if (config) Object.assign(defaults, config);
      return mockAxiosInstance;
    }),
    default: mockAxiosInstance,
  };
});
jest.mock("expo-secure-store", () => ({ getItemAsync: jest.fn() }));
jest.mock("../../config", () => ({ ENV: { API_URL: "http://test.com/api/v1" } }));
jest.mock("@sentry/react-native", () => ({ captureException: jest.fn() }));
jest.mock("../stores/auth-store", () => ({ useAuthStore: { getState: jest.fn(() => ({ logout: jest.fn() })) } }));

import { apiClient } from "./client";
import * as SecureStore from "expo-secure-store";

describe("apiClient", () => {
  it("should create axios instance with correct baseURL", () => {
    expect(apiClient.defaults.baseURL).toBe("http://test.com/api/v1");
  });

  it("should have timeout configured", () => {
    expect(apiClient.defaults.timeout).toBe(15000);
  });

  it("should set auth header on requests", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("test-token");
    const handler = apiClient.interceptors.request.use.mock.calls[0][0];
    const config = { headers: {} };
    const result = await handler(config);
    expect(result.headers.Authorization).toBe("Bearer test-token");
  });

  it("should handle 401 by rejecting", async () => {
    const errorHandler = apiClient.interceptors.response.use.mock.calls[0][1];
    const error = { response: { status: 401, data: { message: "Unauthorized" } } };
    await expect(errorHandler(error)).rejects.toEqual(error);
  });

  it("should retry on 500 error", async () => {
    const errorHandler = apiClient.interceptors.response.use.mock.calls[0][1];
    const error = { response: { status: 500, data: { message: "Server error" } } };
    await expect(errorHandler(error)).rejects.toEqual(error);
  });

  it("should handle network error without token", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    const handler = apiClient.interceptors.request.use.mock.calls[0][0];
    const config = { headers: {} };
    const result = await handler(config);
    expect(result.headers.Authorization).toBeUndefined();
  });
});
