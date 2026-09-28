import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { NavigationAppId } from "../navigation-apps";

export const NAVIGATION_APP_KEY = "bexiemart-navigation-app";

interface NavigationAppState {
  app: NavigationAppId;
  setApp: (app: NavigationAppId) => void;
}

// Rider's turn-by-turn app for the Navigate button on an active delivery.
// Device-local: it depends on which apps this phone has installed.
export const useNavigationApp = create<NavigationAppState>()(
  persist(
    (set) => ({
      app: "google",
      setApp: (app) => set({ app }),
    }),
    {
      name: NAVIGATION_APP_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ app: s.app }),
    }
  )
);
