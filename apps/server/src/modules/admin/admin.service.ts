import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

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
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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

  async updateUserRole(id: string, role: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    return this.prisma.user.update({ where: { id }, data: { role } });
  }

  // ─── Vendors ───────────────────────────────────────────────────────────────────

  async listVendors() {
    const vendors = await this.prisma.vendorProfile.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return Promise.all(
      vendors.map(async (v) => {
        const orderItems = await this.prisma.orderItem.findMany({
          where: { product: { vendorId: v.id } },
          select: { orderId: true, order: { select: { status: true } } },
        });
        const totalOrders = new Set(orderItems.map((o) => o.orderId)).size;
        const pendingOrders = orderItems.filter((o) => o.order.status === "pending").length;

        return {
          ...v,
          _count: undefined,
          productCount: v._count.products,
          orderStats: { totalOrders, pendingOrders },
        };
      }),
    );
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

  async updateConfig(data: any) {
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
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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
}
