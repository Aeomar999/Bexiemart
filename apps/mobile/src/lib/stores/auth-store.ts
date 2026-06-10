import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { authClient } from "../api/better-auth";

const isWeb = Platform.OS === "web";

// In-memory fallback for web to prevent XSS exfiltration from localStorage
const webStorage = new Map<string, string>();

const storage = {
  getItem: async (key: string) => {
    if (isWeb) return webStorage.get(key) || null;
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    if (isWeb) webStorage.set(key, value);
    else await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    if (isWeb) webStorage.delete(key);
    else await SecureStore.deleteItemAsync(key);
  },
};

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasLaunchedBefore: boolean;
  hasSeenOnboarding: boolean;

  setAuth: (user: User, token: string) => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  completeLaunch: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  hasLaunchedBefore: false,
  hasSeenOnboarding: false,

  setAuth: async (user, token) => {
    await storage.setItem("bexiemart_token", token);
    const normalizedUser = { ...user, role: user.role?.toUpperCase() };
    await storage.setItem("bexiemart_user", JSON.stringify(normalizedUser));
    set({ user: normalizedUser, token, isAuthenticated: true, isLoading: false });
  },

  setUser: (user) => {
    set({ user });
  },

  logout: async () => {
    try {
      await authClient.signOut();
    } catch (e) {}
    await storage.removeItem("bexiemart_token");
    await storage.removeItem("bexiemart_user");
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  completeLaunch: async () => {
    await storage.setItem("bexiemart_launched", "true");
    set({ hasLaunchedBefore: true });
  },

  completeOnboarding: async () => {
    await storage.setItem("bexiemart_onboarding", "true");
    await storage.setItem("bexiemart_launched", "true");
    set({ hasSeenOnboarding: true, hasLaunchedBefore: true });
  },

  hydrate: async () => {
    try {
      const [token, onboardingStatus, launchedStatus, cachedUserStr] = await Promise.all([
        storage.getItem("bexiemart_token"),
        storage.getItem("bexiemart_onboarding"),
        storage.getItem("bexiemart_launched"),
        storage.getItem("bexiemart_user"),
      ]);

      const hasSeenOnboarding = onboardingStatus === "true";
      const hasLaunchedBefore = launchedStatus === "true";

      // If we have cached auth data, hydrate instantly
      if (token && cachedUserStr) {
        try {
          const cachedUser = JSON.parse(cachedUserStr);
          set({
            token,
            user: cachedUser,
            isAuthenticated: true,
            isLoading: false,
            hasSeenOnboarding,
            hasLaunchedBefore,
          });
        } catch (e) {}
      } else {
        set({
          isLoading: false,
          hasSeenOnboarding,
          hasLaunchedBefore,
        });
      }

      // Background verification
      authClient
        .getSession()
        .then(async ({ data, error }) => {
          if (data && data.user) {
            const tokenVal = data.session?.token || data.session?.id || token;
            const normalizedUser = { ...data.user, role: (data.user as any).role?.toUpperCase() };

            if (tokenVal) await storage.setItem("bexiemart_token", tokenVal);
            await storage.setItem("bexiemart_user", JSON.stringify(normalizedUser));

            set({
              token: tokenVal,
              user: normalizedUser,
              isAuthenticated: !!tokenVal,
            });
          } else if (!token && !cachedUserStr) {
            // Only clear if we were already clear
          } else {
            // If we had cache but background check failed (e.g. token expired)
            // we might want to log out. However, if it failed due to network error,
            // we shouldn't log out. Better Auth returns { data: null, error: { message: "..." } }
            // Check if error is specifically unauthorized/session expired before wiping.
            if (error && (error.status === 401 || error.status === 403)) {
              await storage.removeItem("bexiemart_token");
              await storage.removeItem("bexiemart_user");
              set({ token: null, user: null, isAuthenticated: false });
            }
          }
        })
        .catch(() => {
          // Ignore network errors during background check
        });
    } catch {
      set({ isLoading: false });
    }
  },
}));
