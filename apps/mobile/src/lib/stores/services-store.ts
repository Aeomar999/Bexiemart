import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { servicesApi } from "../api/services";
import { logger } from "../logger";

export interface ServiceProvider {
  id: string;
  name: string;
  category: string;
  service: string;
  rating: number;
  reviews: number;
  price: string;
  about: string;
  availableTimes: string[];
}

export interface ServiceBooking {
  id: string;
  providerId: string;
  providerName: string;
  service: string;
  date: string;
  time: string;
  address: string;
  status: "upcoming" | "completed" | "cancelled";
}

interface ServicesState {
  providers: ServiceProvider[];
  activeBookings: ServiceBooking[];
  isLoading: boolean;

  fetchServices: () => Promise<void>;
  fetchBookings: () => Promise<void>;
  bookService: (id: string, details: { message?: string; scheduledAt?: string }) => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<void>;
}

export const useServicesStore = create<ServicesState>()(
  persist(
    (set, get) => ({
      providers: [],
      activeBookings: [],
      isLoading: false,

      fetchServices: async () => {
        try {
          set({ isLoading: true });
          const response = await servicesApi.getServices();
          set({ providers: response.data, isLoading: false });
        } catch (error) {
          logger.error("Failed to fetch services:", error);
          set({ isLoading: false });
        }
      },

      fetchBookings: async () => {
        try {
          const response = await servicesApi.getBookings();
          set({ activeBookings: response.data });
        } catch (error) {
          logger.error("Failed to fetch bookings:", error);
        }
      },

      bookService: async (id, details) => {
        try {
          await servicesApi.bookService(id, details);
          await get().fetchBookings();
        } catch (error) {
          logger.error("Failed to book service:", error);
          throw error;
        }
      },

      cancelBooking: async (bookingId) => {
        try {
          await servicesApi.cancelBooking(bookingId);
          await get().fetchBookings();
        } catch (error) {
          logger.error("Failed to cancel booking:", error);
          throw error;
        }
      },
    }),
    {
      name: "services-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
