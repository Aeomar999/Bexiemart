import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Inject,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AUTH } from "../../auth/auth.constants";
import { UpdateConfigDto } from "./dto/update-config.dto";
import { CreateAdminDto } from "./dto/create-admin.dto";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUTH) private readonly auth: any
  ) {}

  // ─── Users ─────────────────────────────────────────────────────────────────────

  async listUsers(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { vendorProfile: true },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
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
    // Admin accounts are managed solely through the super-admin-gated admin-team
    // flow (createAdmin), never the generic role endpoint. This closes the
    // privilege-escalation hole where any admin could mint or dismantle admins
    // by reassigning roles. Blocks both granting ADMIN and touching an existing
    // admin's role here.
    if (role === UserRole.ADMIN || user.role === UserRole.ADMIN) {
      throw new ForbiddenException("Admin roles are managed via the admin-team endpoints");
    }
    return this.prisma.user.update({ where: { id }, data: { role } });
  }

  // ─── Admin Team (super-admin only) ──────────────────────────────────────────────

  /** List all admin accounts (both regular admins and super admins). */
  async listAdmins() {
    return this.prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: {
        id: true,
        name: true,
        email: true,
        isSuperAdmin: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Create a brand-new admin account. The password is set by the super admin
   * and stored hashed via better-auth (same path as the bootstrap seed), then
   * the fresh user is escalated to ADMIN. New admins are never super admins.
   */
  async createAdmin(dto: CreateAdminDto) {
    const email = dto.email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException("A user with this email already exists");

    const res = await this.auth.api.signUpEmail({
      body: { email, password: dto.password, name: dto.name },
      asResponse: true,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new BadRequestException(err?.message || "Failed to create admin account");
    }

    return this.prisma.user.update({
      where: { email },
      data: { role: UserRole.ADMIN, emailVerified: true, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isSuperAdmin: true,
        createdAt: true,
      },
    });
  }

  async banUser(id: string, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    // Prevent locking out the admin team: admins cannot be banned via this path.
    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException("Admin accounts cannot be banned");
    }
    // Deactivate the account and revoke all active sessions so the ban takes
    // effect immediately (the AuthGuard also rejects inactive users defensively).
    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { isActive: false, bannedAt: new Date(), banReason: reason ?? null },
      }),
      this.prisma.session.deleteMany({ where: { userId: id } }),
    ]);
    return updated;
  }

  async unbanUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    return this.prisma.user.update({
      where: { id },
      data: { isActive: true, bannedAt: null, banReason: null },
    });
  }

  // ─── Vendors ───────────────────────────────────────────────────────────────────

  async listVendors(page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) {
      where.businessName = { contains: search, mode: "insensitive" };
    }
    const [vendors, total] = await Promise.all([
      this.prisma.vendorProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          _count: { select: { products: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.vendorProfile.count({ where }),
    ]);

    const vendorIds = vendors.map((v) => v.id);

    const allOrderItems = await this.prisma.orderItem.findMany({
      where: { product: { vendorId: { in: vendorIds } } },
      select: {
        orderId: true,
        product: { select: { vendorId: true } },
        order: { select: { status: true } },
      },
    });

    const orderStatsByVendor = vendorIds.reduce(
      (acc, id) => {
        acc[id] = { totalOrders: new Set(), pendingOrders: 0 };
        return acc;
      },
      {} as Record<string, { totalOrders: Set<string>; pendingOrders: number }>
    );

    allOrderItems.forEach((item) => {
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

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getVendor(id: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        products: true,
      },
    });
    if (!vendor) throw new NotFoundException("Vendor profile not found");

    const orderItems = await this.prisma.orderItem.findMany({
      where: { product: { vendorId: id } },
      include: { order: { select: { status: true } } },
    });

    const totalOrders = new Set(orderItems.map((item) => item.orderId)).size;
    const pendingOrders = orderItems.filter((item) => item.order?.status === "pending").length;

    return {
      ...vendor,
      orderStats: { totalOrders, pendingOrders },
    };
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

  async listOrders(status?: string, page: number = 1, limit: number = 20, search?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (search) where.id = { contains: search, mode: "insensitive" };

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
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
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

  async listDisputes(page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) {
      where.id = { contains: search, mode: "insensitive" };
    }
    const [data, total] = await Promise.all([
      this.prisma.escrow.findMany({
        where: {
          ...where,
          status: "DISPUTED",
        },
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          order: { select: { orderNumber: true, status: true, total: true } },
          vendor: { select: { shopName: true } },
        },
      }),
      this.prisma.escrow.count({ where: { ...where, status: "DISPUTED" } }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getDispute(id: string) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        vendor: { select: { id: true, shopName: true } },
      },
    });
    if (!escrow) throw new NotFoundException("Escrow not found");
    return escrow;
  }

  async resolveDispute(id: string, action: "REFUND" | "RELEASE", reason: string) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id },
      include: { vendor: true },
    });
    if (!escrow) throw new NotFoundException("Escrow not found");
    if (escrow.status !== "DISPUTED")
      throw new NotFoundException("Escrow is not in disputed state");

    const reference = `admin_${action.toLowerCase()}_${id}_${Date.now()}`;

    if (action === "RELEASE") {
      if (!escrow.vendor) throw new NotFoundException("Escrow vendor not found");
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
    const [totalUsers, totalVendors, totalOrders, pendingOrders, totalRevenueObj] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.vendorProfile.count(),
        this.prisma.order.count(),
        this.prisma.order.count({ where: { status: "pending" } }),
        this.prisma.escrow.aggregate({
          _sum: { commission: true },
          where: { status: "RELEASED" },
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
        by: ["role"],
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
      usersByRole: usersByRole.map((r) => ({ role: r.role, count: r._count })),
      recentUsers,
    };
  }

  async getOrdersReport(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const orders = await this.prisma.order.findMany({
      where,
      select: { id: true, createdAt: true, status: true, total: true },
      orderBy: { createdAt: "asc" },
    });

    return {
      totalOrders: orders.length,
      data: orders,
    };
  }

  // ─── Dispatchers & Deliveries ──────────────────────────────────────────────────

  async listDispatchers(page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
    }
    const [data, total] = await Promise.all([
      this.prisma.dispatcherProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, image: true, phoneNumber: true } },
          _count: { select: { jobs: true } },
        },
      }),
      this.prisma.dispatcherProfile.count({ where }),
    ]);

    const formattedData = data.map((d) => ({
      ...d,
      _count: undefined,
      totalTrips: d._count.jobs,
    }));

    return {
      data: formattedData,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getDispatcher(id: string) {
    const dispatcher = await this.prisma.dispatcherProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, image: true, phoneNumber: true } },
        jobs: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!dispatcher) throw new NotFoundException("Dispatcher not found");

    const stats = {
      totalRides: await this.prisma.deliveryJob.count({
        where: { dispatcherId: id, type: "PARCEL" },
      }),
      totalDeliveries: await this.prisma.deliveryJob.count({
        where: { dispatcherId: id, type: { in: ["ORDER", "FOOD"] } },
      }),
    };

    return { ...dispatcher, stats };
  }

  async updateDispatcherStatus(id: string, status: string) {
    const dispatcher = await this.prisma.dispatcherProfile.findUnique({ where: { id } });
    if (!dispatcher) throw new NotFoundException("Dispatcher not found");
    return this.prisma.dispatcherProfile.update({
      where: { id },
      data: { status },
    });
  }

  async listDeliveries(status?: string, page: number = 1, limit: number = 20) {
    const where: any = {};
    if (status) where.status = status;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.deliveryJob.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { id: true, name: true, phoneNumber: true } },
          dispatcher: {
            select: {
              id: true,
              vehicleType: true,
              plateNumber: true,
              user: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.deliveryJob.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // ─── Food Delivery ─────────────────────────────────────────────────────────────

  async listFoodVendors(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.vendorProfile.findMany({
        where: { foodItems: { some: {} } }, // Vendors that have at least one food item
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          _count: { select: { foodItems: true, foodOrders: true } },
        },
      }),
      this.prisma.vendorProfile.count({ where: { foodItems: { some: {} } } }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async listFoodOrders(status?: string, page: number = 1, limit: number = 20) {
    const where: any = {};
    if (status) where.status = status;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.foodOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, phoneNumber: true } },
          vendor: { select: { id: true, shopName: true } },
        },
      }),
      this.prisma.foodOrder.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // ─── Services ─────────────────────────────────────────────────────────────

  async listServiceVendors(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.vendorProfile.findMany({
        where: { services: { some: {} } },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          _count: { select: { services: true } },
        },
      }),
      this.prisma.vendorProfile.count({ where: { services: { some: {} } } }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async listServiceBookings(status?: string, page: number = 1, limit: number = 20) {
    const where: any = {};
    if (status) where.status = status;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.serviceBooking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, phoneNumber: true } },
          service: {
            select: { id: true, name: true, price: true, vendor: { select: { shopName: true } } },
          },
        },
      }),
      this.prisma.serviceBooking.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // ─── Marketing (Flash Sales & Coupons) ───────────────────────────────────

  async listFlashSales(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.flashSale.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { items: true } },
        },
      }),
      this.prisma.flashSale.count(),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async createFlashSale(data: any) {
    return this.prisma.flashSale.create({
      data: {
        title: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: true,
      },
    });
  }

  async listCoupons(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.coupon.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          vendor: { select: { shopName: true } },
        },
      }),
      this.prisma.coupon.count(),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async createCoupon(data: any) {
    return this.prisma.coupon.create({
      data: {
        code: data.code,
        discountPercent: Number(data.discountValue), // Assuming input uses discountValue for the percentage
        minOrderAmount: data.minOrderAmount ? Number(data.minOrderAmount) : undefined,
        expiresAt: new Date(data.endDate),
        maxUses: data.usageLimit ? Number(data.usageLimit) : 100,
        isActive: true,
        vendorId: null, // Admin global coupons have no vendor
      },
    });
  }

  // ─── Content Moderation (Reels & Reviews) ───────────────────────────────

  async listReels(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.reel.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          product: { select: { name: true } },
        },
      }),
      this.prisma.reel.count(),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async toggleReelStatus(id: string) {
    const reel = await this.prisma.reel.findUnique({ where: { id } });
    if (!reel) throw new NotFoundException("Reel not found");
    return this.prisma.reel.update({
      where: { id },
      data: { isActive: !reel.isActive },
    });
  }

  async listReviews(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true } },
          product: { select: { name: true, vendor: { select: { shopName: true } } } },
        },
      }),
      this.prisma.review.count(),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async deleteReview(id: string) {
    return this.prisma.review.delete({ where: { id } });
  }

  // ─── Referrals ─────────────────────────────────────────────────────────────

  async listReferrals(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.referral.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          _count: { select: { referredUsers: true } },
        },
      }),
      this.prisma.referral.count(),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
