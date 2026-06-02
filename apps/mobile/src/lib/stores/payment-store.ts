import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { customerPaymentMethodsApi } from "../api/customer-payment-methods";
import { logger } from "../logger";

export interface PaymentMethod {
  id: string;
  type: "card" | "momo";
  provider: "visa" | "mastercard" | "mtn" | "telecel" | "airteltigo";
  details: string; // "•••• 4242" or "+233 24 123 4567"
  holderName: string;
  expiry?: string; // e.g. "12/26", only for cards
  isDefault: boolean;
}

interface PaymentState {
  paymentMethods: PaymentMethod[];
  isLoading: boolean;
  fetchPaymentMethods: () => Promise<void>;
  addCardMethod: (data: {
    provider: string;
    details: string;
    holderName: string;
    expiry: string;
    isDefault?: boolean;
  }) => Promise<void>;
  addMomoMethod: (data: {
    provider: string;
    details: string;
    holderName: string;
    isDefault?: boolean;
  }) => Promise<void>;
  removePaymentMethod: (id: string) => Promise<void>;
  setDefaultPaymentMethod: (id: string) => Promise<void>;
}

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set, get) => ({
      paymentMethods: [],
      isLoading: false,

      fetchPaymentMethods: async () => {
        try {
          set({ isLoading: true });
          const response = await customerPaymentMethodsApi.getAll();
          set({ paymentMethods: response.data, isLoading: false });
        } catch (error) {
          logger.error("Failed to fetch payment methods:", error);
          set({ isLoading: false });
        }
      },

      addCardMethod: async (data) => {
        try {
          await customerPaymentMethodsApi.addCard(data);
          await get().fetchPaymentMethods();
        } catch (error) {
          logger.error("Failed to add card:", error);
          throw error;
        }
      },

      addMomoMethod: async (data) => {
        try {
          await customerPaymentMethodsApi.addMomo(data);
          await get().fetchPaymentMethods();
        } catch (error) {
          logger.error("Failed to add mobile money:", error);
          throw error;
        }
      },

      removePaymentMethod: async (id) => {
        try {
          await customerPaymentMethodsApi.remove(id);
          await get().fetchPaymentMethods();
        } catch (error) {
          logger.error("Failed to remove payment method:", error);
          throw error;
        }
      },

      setDefaultPaymentMethod: async (id) => {
        try {
          await customerPaymentMethodsApi.setDefault(id);
          await get().fetchPaymentMethods();
        } catch (error) {
          logger.error("Failed to set default payment method:", error);
          throw error;
        }
      },
    }),
    {
      name: "payment-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
