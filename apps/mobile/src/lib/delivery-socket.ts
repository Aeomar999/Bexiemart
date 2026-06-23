import { io, Socket } from "socket.io-client";
import { ENV } from "../config";
import { useAuthStore } from "./stores/auth-store";

/**
 * Real-time channel for delivery dispatch + live tracking (server `/delivery`
 * namespace). Customers subscribe to a job to watch the driver move; drivers
 * stream their location while on a job.
 */
class DeliverySocketService {
  public socket: Socket | null = null;

  connect() {
    const { token } = useAuthStore.getState();
    if (!token) return null;
    if (this.socket?.connected) return this.socket;

    this.socket = io(ENV.DELIVERY_SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on("connect_error", (error) => {
      console.log("Delivery socket connect_error", error);
    });

    return this.socket;
  }

  /** Customer/driver watches a job's live updates. */
  subscribeJob(jobId: string) {
    this.connect()?.emit("subscribe_job", { jobId });
  }

  unsubscribeJob(jobId: string) {
    this.socket?.emit("unsubscribe_job", { jobId });
  }

  /** Driver streams their position (optionally tagged to an active job). */
  sendLocation(lat: number, lng: number, jobId?: string) {
    this.socket?.emit("driver_location", { lat, lng, jobId });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  get() {
    return this.socket;
  }
}

export const deliverySocketService = new DeliverySocketService();
