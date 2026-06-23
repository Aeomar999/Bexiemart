import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger, Inject, forwardRef } from "@nestjs/common";
import { AUTH } from "../../auth/auth.constants";
import { DeliveryService } from "./delivery.service";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

/**
 * Real-time channel for delivery dispatch and live tracking.
 *
 * Auth handshake mirrors {@link ChatGateway} (better-auth session token →
 * `user:{id}` room). Customers join `job:{id}` to watch their delivery; drivers
 * stream `driver_location` which is persisted and fanned out to that room.
 */
@WebSocketGateway({ namespace: "/delivery" })
export class DeliveryGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger("DeliveryGateway");
  private readonly userSockets = new Map<string, Set<string>>();

  constructor(
    @Inject(forwardRef(() => DeliveryService))
    private readonly deliveryService: DeliveryService,
    @Inject(AUTH) private readonly auth: any
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        client.emit("error", "Missing authentication token");
        client.disconnect();
        return;
      }
      const headers = new Headers();
      headers.set("cookie", `better-auth.session_token=${token}`);
      const session = await this.auth.api.getSession({ headers });
      if (!session?.user) {
        client.emit("error", "Invalid session");
        client.disconnect();
        return;
      }
      const userId = session.user.id as string;
      client.userId = userId;
      client.join(`user:${userId}`);

      let sockets = this.userSockets.get(userId);
      if (!sockets) {
        sockets = new Set();
        this.userSockets.set(userId, sockets);
      }
      sockets.add(client.id);
    } catch {
      client.emit("error", "Authentication failed");
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (!client.userId) return;
    const sockets = this.userSockets.get(client.userId);
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) this.userSockets.delete(client.userId);
    }
  }

  /** Dispatcher streams position; persisted and relayed to the job watchers. */
  @SubscribeMessage("driver_location")
  async handleDriverLocation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { lat?: number; lng?: number; jobId?: string }
  ) {
    if (!client.userId) return;
    const { lat, lng, jobId } = data ?? {};
    if (typeof lat !== "number" || typeof lng !== "number") return;

    await this.deliveryService.recordDriverLocation(client.userId, lat, lng);

    if (jobId) {
      this.server.to(`job:${jobId}`).emit("driver_location", { jobId, lat, lng });
    }
  }

  /** Customer (or dispatcher) subscribes to a job's live updates. */
  @SubscribeMessage("subscribe_job")
  handleSubscribeJob(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { jobId?: string }
  ) {
    if (!client.userId || !data?.jobId) return;
    client.join(`job:${data.jobId}`);
  }

  @SubscribeMessage("unsubscribe_job")
  handleUnsubscribeJob(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { jobId?: string }
  ) {
    if (!client.userId || !data?.jobId) return;
    client.leave(`job:${data.jobId}`);
  }

  // ─── Server-side emitters (called by DeliveryService) ──────────────────────

  /** Offer a freshly created job to a set of nearby online drivers. */
  emitJobOffer(driverUserIds: string[], job: unknown) {
    for (const userId of driverUserIds) {
      this.server.to(`user:${userId}`).emit("job_offer", job);
    }
  }

  /** Broadcast a lifecycle change to the job room + the two parties. */
  emitJobUpdate(job: { id: string; customerId: string; dispatcherUserId?: string | null }) {
    this.server.to(`job:${job.id}`).emit("job_update", job);
    this.server.to(`user:${job.customerId}`).emit("job_update", job);
    if (job.dispatcherUserId) {
      this.server.to(`user:${job.dispatcherUserId}`).emit("job_update", job);
    }
  }
}
