import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

const storage = {
  getItem: async (key: string) => {
    if (isWeb) return localStorage.getItem(key);
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    if (isWeb) localStorage.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    if (isWeb) localStorage.removeItem(key);
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

      if (token) {
        try {
          // Fetch user profile to get up-to-date role
          const baseUrl = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:3000/api/v1";
          const res = await fetch(`${baseUrl}/auth/me`, {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            set({ token, user: data.user, isAuthenticated: true, isLoading: false, hasSeenOnboarding, hasLaunchedBefore });
          } else {
            // Token might be expired
            await storage.removeItem("bexiemart_token");
            set({ token: null, user: null, isAuthenticated: false, isLoading: false, hasSeenOnboarding, hasLaunchedBefore });
          }
        } catch (e) {
          // Network error, keep token but we don't have user object yet.
          // In a real app we might cache the user object in secure store too.
          set({ token, isAuthenticated: true, isLoading: false, hasSeenOnboarding, hasLaunchedBefore });
        }
      } else {
        set({ isLoading: false, hasSeenOnboarding, hasLaunchedBefore });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
