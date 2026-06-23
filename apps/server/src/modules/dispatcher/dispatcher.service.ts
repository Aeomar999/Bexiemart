import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { UserRole } from "@prisma/client";
import { DeliveryService } from "../delivery/delivery.service";

@Injectable()
export class DispatcherService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly delivery: DeliveryService
  ) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.dispatcherProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException("Dispatcher profile not found");
    }
    return profile;
  }

  async createProfile(userId: string, data: any) {
    const existing = await this.prisma.dispatcherProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new BadRequestException("Profile already exists");
    }

    // Only update the user's role to dispatcher if they are currently a regular customer
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user && user.role === UserRole.CUSTOMER) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { role: UserRole.DISPATCHER },
      });
    }

    return this.prisma.dispatcherProfile.create({
      data: {
        userId,
        vehicleType: data.vehicleType || "bike",
        plateNumber: data.plateNumber || "UNKNOWN",
        drivingLicense: data.drivingLicense,
      },
    });
  }

  async updateStatus(userId: string, status: "ONLINE" | "OFFLINE") {
    const profile = await this.getProfile(userId);
    return this.prisma.dispatcherProfile.update({
      where: { id: profile.id },
      data: { status },
    });
  }

  async updateLocation(userId: string, lat: number, lng: number) {
    const profile = await this.getProfile(userId);
    return this.prisma.dispatcherProfile.update({
      where: { id: profile.id },
      data: {
        lastLatitude: lat,
        lastLongitude: lng,
        lastLocationAt: new Date(),
      },
    });
  }

  // ─── Task feed & lifecycle (delegated to the unified DeliveryService) ───────

  async getAvailableTasks(userId: string, page = 1, limit = 20) {
    const profile = await this.getProfile(userId);
    return this.delivery.getAvailableJobs(profile, page, limit);
  }

  async getMyTasks(userId: string, status: "active" | "completed", page = 1, limit = 20) {
    const profile = await this.getProfile(userId);
    return this.delivery.getDispatcherJobs(profile.id, status, page, limit);
  }

  async acceptTask(userId: string, taskId: string) {
    const profile = await this.getProfile(userId);
    return this.delivery.acceptJob(profile, taskId);
  }

  async updateTaskStatus(userId: string, taskId: string, status: string) {
    const profile = await this.getProfile(userId);
    return this.delivery.updateJobStatus(profile, taskId, status as any);
  }

  // ─── Earnings & Wallet ─────────────────────────────────────────────────────

  async getEarnings(userId: string) {
    const profile = await this.getProfile(userId);
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });

    const transactions = wallet
      ? await this.prisma.transaction.findMany({
          where: { walletId: wallet.id },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay());
    thisWeek.setHours(0, 0, 0, 0);

    const todayRevenue = transactions
      .filter((t) => t.type === "EARNINGS" && t.createdAt >= today)
      .reduce((s, t) => s + Number(t.netAmount), 0);

    const thisWeekRevenue = transactions
      .filter((t) => t.type === "EARNINGS" && t.createdAt >= thisWeek)
      .reduce((s, t) => s + Number(t.netAmount), 0);

    const formattedTransactions = transactions.map((t) => ({
      id: t.reference || t.id,
      type: t.type === "WITHDRAWAL" ? "withdrawal" : "order",
      title: t.description || (t.type === "WITHDRAWAL" ? "Bank Transfer" : "Delivery Payout"),
      date: t.createdAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      amount: t.type === "WITHDRAWAL" ? -Number(t.amount) : Number(t.netAmount),
      status: t.status.toLowerCase(),
    }));

    return {
      availableBalance: wallet ? Number(wallet.balance) : 0,
      pendingClearance: Number(profile.pendingPayout),
      todayRevenue,
      thisWeekRevenue,
      recentTransactions: formattedTransactions.slice(0, 10),
    };
  }

  async getTransactions(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return [];

    const transactions = await this.prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return transactions.map((t) => ({
      id: t.reference || t.id,
      type: t.type === "WITHDRAWAL" ? "withdrawal" : "order",
      title: t.description || (t.type === "WITHDRAWAL" ? "Bank Transfer" : "Delivery Payout"),
      date: t.createdAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      amount: t.type === "WITHDRAWAL" ? -Number(t.amount) : Number(t.netAmount),
      status: t.status.toLowerCase(),
    }));
  }

  async getAnalytics(userId: string) {
    const profile = await this.getProfile(userId);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [jobs, wallet] = await Promise.all([
      this.prisma.deliveryJob.findMany({
        where: {
          dispatcherId: profile.id,
          status: "DELIVERED",
          createdAt: { gte: thirtyDaysAgo },
        },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.wallet.findUnique({ where: { userId } }),
    ]);

    const recentTransactions = wallet
      ? await this.prisma.transaction.findMany({
          where: {
            walletId: wallet.id,
            type: "EARNINGS",
            createdAt: { gte: thirtyDaysAgo },
          },
          orderBy: { createdAt: "asc" },
        })
      : [];

    const revenue30Days = recentTransactions.reduce((s, t) => s + Number(t.netAmount), 0);

    return {
      revenue30Days: Math.round(revenue30Days * 100) / 100,
      trips30Days: jobs.length,
      revenueTimeline: recentTransactions.reduce(
        (acc: { date: string; amount: number }[], t) => {
          const date = t.createdAt.toISOString().split("T")[0];
          const existing = acc.find((a) => a.date === date);
          if (existing) existing.amount += Number(t.netAmount);
          else acc.push({ date, amount: Number(t.netAmount) });
          return acc;
        },
        [] as { date: string; amount: number }[]
      ),
    };
  }

  async withdrawEarnings(userId: string, amount: number, destination: string) {
    const profile = await this.getProfile(userId);
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException("Wallet not found");

    // Withdrawals draw from cleared, spendable balance only. Held earnings sit
    // in pendingPayout until the customer confirms delivery (see
    // DeliveryService.confirmDelivery), so they are intentionally not available.
    if (Number(wallet.balance) < amount) {
      throw new BadRequestException("Insufficient available balance");
    }

    await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      }),
      this.prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: "WITHDRAWAL",
          status: "COMPLETED",
          amount,
          fee: 0,
          netAmount: amount,
          currency: wallet.currency,
          reference: `DSP-WD-${profile.id}-${Date.now()}`,
          description: `Withdrawal to ${destination}`,
          metadata: { destination },
        },
      }),
    ]);

    return { success: true, reference: `WD-${Date.now()}` };
  }
}
