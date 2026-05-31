import { Injectable, NotFoundException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { UpdateConfigDto } from "./dto/update-config.dto";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Users ─────────────────────────────────────────────────────────────────────

  async listUsers(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { vendorProfile: true },
      }),
      this.prisma.user.count(),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit)  } };
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        orders: true,
        payments: true,
        wallet: true,
        vendorProfile: true,
      },
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async updateUserRole(id: string, role: UserRole) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    return this.prisma.user.update({ where: { id }, data: { role } });
  }

  // ─── Vendors ───────────────────────────────────────────────────────────────────

  async listVendors(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [vendors, total] = await Promise.all([
      this.prisma.vendorProfile.findMany({
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          _count: { select: { products: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.vendorProfile.count()
    ]);

    const vendorIds = vendors.map(v => v.id);

    const allOrderItems = await this.prisma.orderItem.findMany({
      where: { product: { vendorId: { in: vendorIds } } },
      select: { orderId: true, product: { select: { vendorId: true } }, order: { select: { status: true } } },
    });

    const orderStatsByVendor = vendorIds.reduce((acc, id) => {
      acc[id] = { totalOrders: new Set(), pendingOrders: 0 };
      return acc;
    }, {} as Record<string, { totalOrders: Set<string>; pendingOrders: number }>);

    allOrderItems.forEach(item => {
      const vid = item.product?.vendorId;
      if (!vid || !orderStatsByVendor[vid]) return;
      orderStatsByVendor[vid].totalOrders.add(item.orderId);
      if (item.order?.status === "pending") {
        orderStatsByVendor[vid].pendingOrders++;
      }
    });

    const data = vendors.map((v) => {
      const stats = orderStatsByVendor[v.id];
      return {
        ...v,
        _count: undefined,
        productCount: v._count.products,
        orderStats: { totalOrders: stats.totalOrders.size, pendingOrders: stats.pendingOrders },
      };
    });

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit)  } };
  }

  async approveVendor(id: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({ where: { id } });
    if (!vendor) throw new NotFoundException("Vendor profile not found");
    return this.prisma.vendorProfile.update({ where: { id }, data: { isActive: true } });
  }

  async suspendVendor(id: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({ where: { id } });
    if (!vendor) throw new NotFoundException("Vendor profile not found");
    return this.prisma.vendorProfile.update({ where: { id }, data: { isActive: false } });
  }

  // ─── Platform Config ───────────────────────────────────────────────────────────

  async getConfig() {
    const config = await this.prisma.platformConfig.findFirst();
    if (!config) throw new NotFoundException("Platform config not found");
    return config;
  }

  async updateConfig(data: UpdateConfigDto) {
    const existing = await this.prisma.platformConfig.findFirst();
    if (existing) {
      return this.prisma.platformConfig.update({ where: { id: existing.id }, data });
    }
    return this.prisma.platformConfig.create({ data });
  }

  // ─── Orders Oversight ──────────────────────────────────────────────────────────

  async listOrders(status?: string, page: number = 1, limit: number = 20) {
    const where: any = {};
    if (status) where.status = status;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit)  } };
  }

  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: true,
        payment: true,
        shippingAddress: true,
      },
    });
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  async updateOrderStatus(id: string, status: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException("Order not found");
    return this.prisma.order.update({ where: { id }, data: { status: status as any } });
  }

  // ─── Disputes ──────────────────────────────────────────────────────────────────

  async listDisputes(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.escrow.findMany({
        where: { status: "DISPUTED" },
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          order: { select: { orderNumber: true, status: true, total: true } },
          vendor: { select: { shopName: true } },
        },
      }),
      this.prisma.escrow.count({ where: { status: "DISPUTED" } }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit)  } };
  }

  async resolveDispute(id: string, action: "REFUND" | "RELEASE", reason: string) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id },
      include: { vendor: true },
    });
    if (!escrow) throw new NotFoundException("Escrow not found");
    if (escrow.status !== "DISPUTED") throw new NotFoundException("Escrow is not in disputed state");

    const reference = `admin_${action.toLowerCase()}_${id}_${Date.now()}`;

    if (action === "RELEASE") {
      const vendorWallet = await this.prisma.wallet.findUnique({
        where: { userId: escrow.vendor.userId },
      });
      if (!vendorWallet) throw new NotFoundException("Vendor wallet not found");

      return this.prisma.$transaction(async (tx) => {
        const txn = await tx.transaction.create({
          data: {
            walletId: vendorWallet.id,
            type: "EARNINGS",
            status: "COMPLETED",
            amount: escrow.amount,
            fee: Number(escrow.commission),
            netAmount: Number(escrow.netAmount),
            reference,
            description: `Admin dispute resolution (RELEASE): ${reason}`,
            counterpartyWalletId: escrow.buyerWalletId,
          },
        });

        await tx.wallet.update({
          where: { id: vendorWallet.id },
          data: { balance: { increment: Number(escrow.netAmount) } },
        });

        return tx.escrow.update({
          where: { id },
          data: {
            status: "RELEASED",
            releasedAt: new Date(),
            releasedTxnId: txn.id,
            vendorWalletId: vendorWallet.id,
            reason: `Admin resolved: RELEASED - ${reason}`,
          },
        });
      });
    } else {
      return this.prisma.$transaction(async (tx) => {
        const txn = await tx.transaction.create({
          data: {
            walletId: escrow.buyerWalletId,
            type: "REVERSAL",
            status: "COMPLETED",
            amount: escrow.amount,
            fee: 0,
            netAmount: Number(escrow.amount),
            reference,
            description: `Admin dispute resolution (REFUND): ${reason}`,
            counterpartyWalletId: escrow.vendorWalletId,
          },
        });

        await tx.wallet.update({
          where: { id: escrow.buyerWalletId },
          data: { balance: { increment: Number(escrow.amount) } },
        });

        return tx.escrow.update({
          where: { id },
          data: {
            status: "REFUNDED",
            refundedAt: new Date(),
            refundedTxnId: txn.id,
            reason: `Admin resolved: REFUNDED - ${reason}`,
          },
        });
      });
    }
  }

  // ─── Dashboard ─────────────────────────────────────────────────────────────────

  async getDashboardStats() {
    const [totalUsers, totalVendors, totalOrders, pendingOrders, totalRevenueObj] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.vendorProfile.count(),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: "pending" } }),
      this.prisma.escrow.aggregate({
        _sum: { commission: true },
        where: { status: "RELEASED" }
      }),
    ]);

    return {
      totalUsers,
      totalVendors,
      totalOrders,
      pendingOrders,
      totalRevenue: totalRevenueObj._sum.commission || 0,
    };
  }

  // ─── Reports ───────────────────────────────────────────────────────────────────

  async getRevenueReport(startDate?: string, endDate?: string) {
    const where: any = { status: "RELEASED" };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const escrows = await this.prisma.escrow.findMany({
      where,
      select: { commission: true, amount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const totalCommission = escrows.reduce((sum, e) => sum + Number(e.commission || 0), 0);
    const totalSales = escrows.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    return {
      totalCommission,
      totalSales,
      transactions: escrows.length,
      data: escrows,
    };
  }

  async getUsersReport(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [totalUsers, usersByRole, recentUsers] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: true,
        where,
      }),
      this.prisma.user.findMany({
        where,
        take: 50,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
    ]);

    return {
      totalUsers,
      usersByRole: usersByRole.map(r => ({ role: r.role, count: r._count })),
      recentUsers,
    };
  }
}
