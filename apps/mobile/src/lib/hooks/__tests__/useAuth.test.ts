import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/auth", () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
    verifyEmail: jest.fn(),
    resendVerificationEmail: jest.fn(),
  },
}));;

import { useLogin, useRegister, useLogout, useCurrentUser, useVerifyEmail, useResendVerification } from "../use-auth";
import { authApi } from "../../api/auth";
import { createWrapper } from "./test-utils";

describe("useLogin", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call login mutation with credentials", async () => {
    (authApi.login as jest.Mock).mockResolvedValue({ data: { token: "abc", user: { id: "1", email: "a@b.com" } } });
    const { result} = renderHook(() => useLogin(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ email: "a@b.com", password: "123" });
    expect(authApi.login).toHaveBeenCalledWith({ email: "a@b.com", password: "123" });
  });

  it("should handle login error", async () => {
    (authApi.login as jest.Mock).mockRejectedValue(new Error("Invalid credentials"));
    const { result} = renderHook(() => useLogin(), { wrapper: createWrapper() });
    result.current.mutate({ email: "bad@test.com", password: "wrong" });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("should call register mutation with user data", async () => {
    (authApi.register as jest.Mock).mockResolvedValue({ data: { token: "abc" } });
    const { result} = renderHook(() => useRegister(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ email: "a@b.com", password: "123", name: "Test" });
    expect(authApi.register).toHaveBeenCalledWith({ email: "a@b.com", password: "123", name: "Test" });
  });

  it("should handle register validation error", async () => {
    (authApi.register as jest.Mock).mockRejectedValue(new Error("Email already exists"));
    const { result} = renderHook(() => useRegister(), { wrapper: createWrapper() });
    result.current.mutate({ email: "existing@test.com", password: "123", name: "Test" });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useLogout", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call logout on mutation", async () => {
    const { result} = renderHook(() => useLogout(), { wrapper: createWrapper() });
    await result.current.mutateAsync();
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});

describe("useCurrentUser", () => {
  let mockUseAuthStore: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // Get the mocked useAuthStore and make its selectors return a token
    mockUseAuthStore = require("../../stores/auth-store").useAuthStore;
    mockUseAuthStore.mockImplementation((selector?: (state: any) => any) => {
      const state = {
        user: null,
        token: "test-token",
        isAuthenticated: true,
        setAuth: jest.fn(),
        setUser: jest.fn(),
        logout: jest.fn(),
      };
      return selector ? selector(state) : state;
    });
  });

  afterEach(() => {
    // Reset to default (no token)
    mockUseAuthStore.mockImplementation((selector?: (state: any) => any) => {
      const state = {
        user: null,
        token: null,
        isAuthenticated: false,
        setAuth: jest.fn(),
        setUser: jest.fn(),
        logout: jest.fn(),
      };
      return selector ? selector(state) : state;
    });
  });

  it("should fetch current user when token exists", async () => {
    (authApi.getCurrentUser as jest.Mock).mockResolvedValue({ data: { user: { id: "1", email: "a@b.com" } } });
    const { result } = renderHook(() => useCurrentUser(), { wrapper: createWrapper() });
    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
  });

  it("should return user data on success", async () => {
    (authApi.getCurrentUser as jest.Mock).mockResolvedValue({ data: { user: { id: "1", email: "a@b.com" } } });
    const { result} = renderHook(() => useCurrentUser(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual({ id: "1", email: "a@b.com" });
    expect(result.current.isLoading).toBe(false);
  });
});
