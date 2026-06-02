import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { walletApi } from "../api/wallet";
import { logger } from "../logger";

export type TransactionType =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "ORDER_PAYMENT"
  | "TRANSFER_RECEIVED"
  | "FEE";
export type TransactionStatus = "COMPLETED" | "PENDING" | "FAILED";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  status: TransactionStatus;
  recipient?: string;
  reference?: string;
}

interface WalletState {
  balance: number;
  currency: string;
  accountName: string;
  accountNumber: string;
  bexieCoins: number;
  transactions: Transaction[];
  isLoading: boolean;

  fetchWallet: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  topUp: (amount: number, method: string) => Promise<void>;
  sendMoney: (amount: number, recipient: string, pin: string) => Promise<void>;
  addTransaction: (tx: {
    type: TransactionType;
    amount: number;
    description: string;
    status: TransactionStatus;
    reference?: string;
  }) => void;
  spendBexieCoins: (amount: number) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      balance: 0,
      currency: "GHS",
      accountName: "",
      accountNumber: "",
      bexieCoins: 0,
      transactions: [],
      isLoading: false,

      fetchWallet: async () => {
        try {
          set({ isLoading: true });
          const response = await walletApi.getWallet();
          set({
            balance: Number(response.data.balance),
            currency: response.data.currency,
            accountName: response.data.user?.name || "",
            accountNumber: response.data.id || "",
            bexieCoins: response.data.bexieCoins || 0,
            isLoading: false,
          });
        } catch (error) {
          logger.error("Failed to fetch wallet:", error);
          set({ isLoading: false });
        }
      },

      fetchTransactions: async () => {
        try {
          const response = await walletApi.getTransactions();
          set({ transactions: response.data });
        } catch (error) {
          logger.error("Failed to fetch transactions:", error);
        }
      },

      topUp: async (amount: number, method: string) => {
        try {
          await walletApi.initializeTopUp(amount, method);
          await get().fetchWallet();
          await get().fetchTransactions();
        } catch (error) {
          logger.error("TopUp failed:", error);
          throw error;
        }
      },

      addTransaction: (tx) => {
        const newTx: Transaction = {
          id: `tx${Date.now()}`,
          ...tx,
          date: new Date().toISOString(),
        };
        set((state) => ({
          transactions: [newTx, ...state.transactions],
        }));
      },

      spendBexieCoins: (amount) => {
        set((state) => ({
          bexieCoins: Math.max(0, state.bexieCoins - amount),
        }));
      },

      sendMoney: async (amount: number, recipient: string, pin: string) => {
        try {
          await walletApi.transfer(recipient, amount, pin);
          await get().fetchWallet();
          await get().fetchTransactions();
        } catch (error) {
          logger.error("Transfer failed:", error);
          throw error;
        }
      },
    }),
    {
      name: "wallet-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
