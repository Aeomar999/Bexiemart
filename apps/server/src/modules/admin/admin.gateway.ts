import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { wsCorsOptions } from "../../common/ws-cors";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

const ADMIN_ROOM = "admin";

/**
 * Real-time channel for the admin portal.
 *
 * Auth mirrors {@link AuthGuard}: the handshake token is the better-auth session
 * token, looked up directly so we get the authoritative `role`/`isActive` from
 * the DB (better-auth's getSession does not surface our custom role field).
 * Only ADMIN accounts are admitted, and all admins share a single `admin` room
 * that the platform fans operational events into.
 */
@WebSocketGateway({ namespace: "/admin", cors: wsCorsOptions() })
export class AdminGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger("AdminGateway");

  constructor(private readonly prisma: PrismaService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        client.emit("error", "Missing authentication token");
        client.disconnect();
        return;
      }

      const session = await this.prisma.session.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!session || session.expiresAt < new Date() || !session.user) {
        client.emit("error", "Invalid or expired session");
        client.disconnect();
        return;
      }
      // Same gates as the REST AuthGuard + AdminGuard: deactivated accounts and
      // non-admins must not receive the live operational feed.
      if (session.user.isActive === false || session.user.role !== UserRole.ADMIN) {
        client.emit("error", "Admin access required");
        client.disconnect();
        return;
      }

      client.userId = session.user.id;
      client.join(ADMIN_ROOM);
    } catch {
      client.emit("error", "Authentication failed");
      client.disconnect();
    }
  }

  handleDisconnect(_client: AuthenticatedSocket) {
    // Room membership is dropped automatically on disconnect; nothing to track.
  }

  // ─── Server-side emitters (called by feature services) ─────────────────────

  emitOrderCreated(payload: { orderId: string; orderNumber: string; total: number }) {
    this.server.to(ADMIN_ROOM).emit("order.created", payload);
  }

  emitVendorRegistered(payload: { vendorId: string; businessName: string }) {
    this.server.to(ADMIN_ROOM).emit("vendor.registered", payload);
  }

  emitDisputeCreated(payload: { disputeId: string; reason: string }) {
    this.server.to(ADMIN_ROOM).emit("dispute.created", payload);
  }

  emitTicketCreated(payload: {
    ticketId: string;
    category: string;
    subject: string;
    priority: string;
  }) {
    this.server.to(ADMIN_ROOM).emit("support.ticket_created", payload);
  }
}
