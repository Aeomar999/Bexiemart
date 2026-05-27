import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './auth-store';

const SOCKET_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace('/api', '/chat');

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Record<string, boolean>;
  connect: () => void;
  disconnect: () => void;
  subscribePresence: (userIds: string[]) => void;
  unsubscribePresence: (userIds: string[]) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  onlineUsers: {},
  
  connect: () => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    
    if (get().socket?.connected) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      set({ isConnected: true });
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    socket.on('presence_update', (data: { userId: string; isOnline: boolean }) => {
      set((state) => ({
        onlineUsers: {
          ...state.onlineUsers,
          [data.userId]: data.isOnline,
        },
      }));
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false, onlineUsers: {} });
    }
  },

  subscribePresence: (userIds: string[]) => {
    const { socket } = get();
    if (socket?.connected && userIds.length > 0) {
      socket.emit('subscribe_presence', { userIds });
    }
  },

  unsubscribePresence: (userIds: string[]) => {
    const { socket } = get();
    if (socket?.connected && userIds.length > 0) {
      socket.emit('unsubscribe_presence', { userIds });
    }
  },
}));
