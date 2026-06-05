import { io, Socket } from "socket.io-client";
import { ENV } from "../config";
import { useAuthStore } from "./stores/auth-store";

class SocketService {
  public socket: Socket | null = null;

  public connect() {
    const { token } = useAuthStore.getState();
    if (!token) return;

    if (this.socket?.connected) return;

    this.socket = io(ENV.SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // Add any global connection logging/monitoring here (e.g. Sentry breadcrumbs)
    this.socket.on("connect_error", (error) => {
      console.log("Socket connect_error", error);
    });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public get() {
    return this.socket;
  }
}

export const socketService = new SocketService();
