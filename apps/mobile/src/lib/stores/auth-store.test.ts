jest.unmock("@/lib/stores/auth-store");
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock("../api/better-auth", () => ({
  authClient: {
    signOut: jest.fn(),
    getSession: jest.fn(),
  },
}));

import { useAuthStore } from "./auth-store";
import * as SecureStore from "expo-secure-store";
import { authClient } from "../api/better-auth";

describe("Auth Store", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      hasLaunchedBefore: false,
      hasSeenOnboarding: false,
    });
    jest.clearAllMocks();
  });

  it("should set auth with normalized role", async () => {
    await useAuthStore
      .getState()
      .setAuth({ id: "u1", name: "Test", email: "test@test.com", role: "user" }, "token123");
    const state = useAuthStore.getState();
    expect(state.user).toEqual({ id: "u1", name: "Test", email: "test@test.com", role: "USER" });
    expect(state.token).toBe("token123");
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("bexiemart_token", "token123");
  });

  it("should set user without changing token", () => {
    useAuthStore.setState({ user: { id: "u1", name: "Old", email: "old@test.com", role: "USER" } });
    useAuthStore
      .getState()
      .setUser({ id: "u1", name: "New", email: "new@test.com", role: "ADMIN" });
    expect(useAuthStore.getState().user?.name).toBe("New");
  });

  it("should logout and clear state", async () => {
    (authClient.signOut as jest.Mock).mockResolvedValue({ data: null });
    useAuthStore.setState({
      user: { id: "u1", name: "T", email: "t@t.com", role: "USER" },
      token: "t",
      isAuthenticated: true,
    });
    await useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("bexiemart_token");
  });

  it("should complete launch", async () => {
    await useAuthStore.getState().completeLaunch();
    expect(useAuthStore.getState().hasLaunchedBefore).toBe(true);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("bexiemart_launched", "true");
  });

  it("should complete onboarding", async () => {
    await useAuthStore.getState().completeOnboarding();
    const state = useAuthStore.getState();
    expect(state.hasSeenOnboarding).toBe(true);
    expect(state.hasLaunchedBefore).toBe(true);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("bexiemart_onboarding", "true");
  });

  it("should hydrate with cached session", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockImplementation((key) => {
      if (key === "bexiemart_token") return Promise.resolve("stored-token");
      if (key === "bexiemart_user")
        return Promise.resolve(
          JSON.stringify({ id: "u1", name: "U", email: "u@u.com", role: "USER" })
        );
      return Promise.resolve(null);
    });
    (authClient.getSession as jest.Mock).mockResolvedValue({
      data: {
        user: { id: "u1", name: "U", email: "u@u.com", role: "user" },
        session: { token: "stored-token" },
      },
      error: null,
    });

    await useAuthStore.getState().hydrate();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.user?.role).toBe("USER");
  });

  it("should hydrate with no session", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (authClient.getSession as jest.Mock).mockResolvedValue({ data: null, error: { status: 401 } });

    await useAuthStore.getState().hydrate();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.user).toBeNull();
  });

  it("should handle hydrate error gracefully", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(new Error("Storage error"));
    await useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});
