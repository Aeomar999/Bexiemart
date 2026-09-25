import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const BALANCE_VISIBILITY_KEY = "bexiemart-balance-visibility";

interface BalanceVisibilityState {
  hidden: boolean;
  toggle: () => void;
}

// One device-wide preference: hiding balances on one screen hides them on
// every balance surface (wallet, earnings, dashboard, rider home pill).
export const useBalanceVisibility = create<BalanceVisibilityState>()(
  persist(
    (set) => ({
      hidden: false,
      toggle: () => set((s) => ({ hidden: !s.hidden })),
    }),
    {
      name: BALANCE_VISIBILITY_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ hidden: s.hidden }),
    }
  )
);
