import { io, Socket } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3000";

let socket: Socket | null = null;

export const getSocket = async () => {
  if (!socket) {
    const res = await fetch("/api/session/token");
    if (!res.ok) throw new Error("Not authenticated");
    const { token } = await res.json();

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

export const connectSocket = async () => {
  const s = await getSocket();
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
