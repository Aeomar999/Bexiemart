import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { socketService } from "../socket";
import { useAuthStore } from "./auth-store";

interface SocketState {
  isConnected: boolean;
  onlineUsers: Record<string, boolean>;
  offlineMessages: any[];
  connect: () => void;
  disconnect: () => void;
  subscribePresence: (userIds: string[]) => void;
  unsubscribePresence: (userIds: string[]) => void;
  enqueueMessage: (message: any) => void;
  flushOfflineMessages: () => void;
}

export const useSocketStore = create<SocketState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      onlineUsers: {},
      offlineMessages: [],

      connect: () => {
        socketService.connect();
        const socket = socketService.get();
        if (!socket) return;

        socket.on("connect", () => {
          set({ isConnected: true });
          get().flushOfflineMessages();
        });

        socket.on("disconnect", () => {
          set({ isConnected: false });
        });

        socket.on("presence_update", (data: { userId: string; isOnline: boolean }) => {
          set((state) => ({
            onlineUsers: {
              ...state.onlineUsers,
              [data.userId]: data.isOnline,
            },
          }));
        });
      },

      disconnect: () => {
        socketService.disconnect();
        set({ isConnected: false, onlineUsers: {} });
      },

      subscribePresence: (userIds: string[]) => {
        const socket = socketService.get();
        if (socket?.connected && userIds.length > 0) {
          socket.emit("subscribe_presence", { userIds });
        }
      },

      unsubscribePresence: (userIds: string[]) => {
        const socket = socketService.get();
        if (socket?.connected && userIds.length > 0) {
          socket.emit("unsubscribe_presence", { userIds });
        }
      },

      enqueueMessage: (message: any) => {
        set((state) => ({ offlineMessages: [...state.offlineMessages, message] }));
        const { isConnected } = get();
        if (isConnected) {
          get().flushOfflineMessages();
        }
      },

      flushOfflineMessages: () => {
        const socket = socketService.get();
        const { offlineMessages } = get();
        if (socket?.connected && offlineMessages.length > 0) {
          offlineMessages.forEach((msg) => {
            socket.emit("send_message", msg);
          });
          set({ offlineMessages: [] });
        }
      },
    }),
    {
      name: "socket-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ offlineMessages: state.offlineMessages }),
    }
  )
);
