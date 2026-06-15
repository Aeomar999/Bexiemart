import { io, Socket } from "socket.io-client";
import { useAuthStore } from "./stores/auth-store";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3000";

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    const token = useAuthStore.getState().token;
    
    socket = io(`${WS_URL}/admin`, {
      auth: { token },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
