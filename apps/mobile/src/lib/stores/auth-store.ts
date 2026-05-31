import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

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
  }
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
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  setUser: (user) => {
    set({ user });
  },

  logout: async () => {
    try {
      const { authClient } = require('../api/better-auth');
      await authClient.signOut();
    } catch(e) {}
    await storage.removeItem("bexiemart_token");
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
      const [token, onboardingStatus, launchedStatus] = await Promise.all([
        storage.getItem("bexiemart_token"),
        storage.getItem("bexiemart_onboarding"),
        storage.getItem("bexiemart_launched"),
      ]);
      
      const hasSeenOnboarding = onboardingStatus === "true";
      const hasLaunchedBefore = launchedStatus === "true";

      // Better Auth handles its own session state, but we still check it here
      const { authClient } = require('../api/better-auth');
      const { data, error } = await authClient.getSession();

      if (data && data.user) {
        // User is authenticated via better-auth
        set({ 
          token: data.session?.token || data.session?.id || token || 'better-auth-token', 
          user: data.user as any, 
          isAuthenticated: true, 
          isLoading: false, 
          hasSeenOnboarding, 
          hasLaunchedBefore 
        });
      } else {
        // Not authenticated
        await storage.removeItem("bexiemart_token");
        set({ token: null, user: null, isAuthenticated: false, isLoading: false, hasSeenOnboarding, hasLaunchedBefore });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
