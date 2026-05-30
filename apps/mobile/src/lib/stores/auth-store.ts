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
  hasSeenOnboarding: boolean;

  setAuth: (user: User, token: string) => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
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

  completeOnboarding: async () => {
    await storage.setItem("bexiemart_onboarding", "true");
    set({ hasSeenOnboarding: true });
  },

  hydrate: async () => {
    try {
      const [token, onboardingStatus] = await Promise.all([
        storage.getItem("bexiemart_token"),
        storage.getItem("bexiemart_onboarding")
      ]);
      
      const hasSeenOnboarding = onboardingStatus === "true";

      if (token) {
        set({ token, isAuthenticated: true, isLoading: false, hasSeenOnboarding });
      } else {
        set({ isLoading: false, hasSeenOnboarding });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
