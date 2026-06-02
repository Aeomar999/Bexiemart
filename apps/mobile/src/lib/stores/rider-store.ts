import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type RideStatus = "searching" | "on_the_way" | "arrived";

export interface ActiveRide {
  id: string;
  pickup: string;
  dropoff: string;
  riderType: string;
  price: number;
  status: RideStatus;
  driverName?: string;
  driverVehicle?: string;
  driverRating?: number;
  estimatedMinutes?: number;
}

interface RiderState {
  activeRide: ActiveRide | null;
  bookRide: (
    details: Omit<
      ActiveRide,
      "id" | "status" | "driverName" | "driverVehicle" | "driverRating" | "estimatedMinutes"
    >
  ) => void;
  updateStatus: (status: RideStatus, extraData?: Partial<ActiveRide>) => void;
  cancelRide: () => void;
}

export const useRiderStore = create<RiderState>()(
  persist(
    (set) => ({
      activeRide: null,

      bookRide: (details) => {
        const newRide: ActiveRide = {
          ...details,
          id: `BXM-${Math.floor(Math.random() * 9000) + 1000}`,
          status: "searching",
        };
        set({ activeRide: newRide });
      },

      updateStatus: (status, extraData = {}) =>
        set((state) => {
          if (!state.activeRide) return state;
          return {
            activeRide: {
              ...state.activeRide,
              ...extraData,
              status,
            },
          };
        }),

      cancelRide: () => set({ activeRide: null }),
    }),
    {
      name: "rider-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
