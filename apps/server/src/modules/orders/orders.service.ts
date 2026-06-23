import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { DeliveryService } from "../delivery/delivery.service";

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly delivery: DeliveryService
  ) {}

  private generateOrderNumber(): string {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BEX-${ts}-${rand}`;
  }

  /**
   * Distance-based delivery fee from the unified pricing engine. Falls back to
   * a flat fee when coordinates can't be resolved (e.g. no maps key in dev, or
   * a platform-fulfilled order with no vendor pickup) so checkout never breaks.
   */
  private async resolveShippingFee(
    vendorId: string | null,
    shippingAddress: CreateOrderDto["shippingAddress"],
    subtotal: number
  ): Promise<number> {
    const FLAT_FALLBACK = 5;
    try {
      const quote = await this.delivery.quoteForOrderDraft({
        vendorId,
        dropoff: {
          latitude: shippingAddress.latitude,
          longitude: shippingAddress.longitude,
          addressParts: [shippingAddress.address, shippingAddress.city, shippingAddress.state],
        },
      });
      return quote ? quote.customerFee : subtotal >= 500 ? 0 : FLAT_FALLBACK;
    } catch {
      return subtotal >= 500 ? 0 : FLAT_FALLBACK;
    }
  }

  async create(userId: string, dto: CreateOrderDto) {
    // Resolve the request down to { productId, quantity } only. Prices and
    // product snapshots are ALWAYS taken from the database below, never from
    // client input, so the client cannot tamper with the amount charged.
    let requested: { productId: string; quantity: number }[] = [];
    let cart: any = null;

    if (dto.items && dto.items.length > 0) {
      requested = dto.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));
    } else {
      cart = await this.prisma.cart.findUnique({
        where: { userId },
        include: { items: true },
      });
      if (!cart || cart.items.length === 0) {
        throw new BadRequestException("Cart is empty");
      }
      requested = cart.items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));
    }

    // Load the authoritative product rows and build trusted line items.
    const lineItems: {
      productId: string;
      productName: string;
      productSlug: string;
      price: number;
      quantity: number;
      lineTotal: number;
      imageUrl: string | null;
    }[] = [];
    let primaryVendorId: string | null = null;
    for (const { productId, quantity } of requested) {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        include: { images: { take: 1, orderBy: { order: "asc" } } },
      });
      if (!product) throw new NotFoundException(`Product ${productId} not found`);
      if (!product.isActive || product.isDeleted) {
        throw new BadRequestException(`Product "${product.name}" is no longer available`);
      }
      if (product.stock < quantity) {
        throw new BadRequestException(`Insufficient stock for "${product.name}"`);
      }
      if (!primaryVendorId && product.vendorId) primaryVendorId = product.vendorId;
      lineItems.push({
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        price: Number(product.price),
        quantity,
        lineTotal: Number(product.price) * quantity,
        imageUrl: product.images?.[0]?.url ?? null,
      });
    }

    const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const shippingFee = await this.resolveShippingFee(
      primaryVendorId,
      dto.shippingAddress,
      subtotal
    );
    const tax = Math.round(subtotal * 0.075 * 100) / 100;
    const total = subtotal + shippingFee + tax;
    const orderNumber = this.generateOrderNumber();

    const order = await this.prisma.$transaction(async (tx) => {
      const shippingAddr = await tx.shippingAddress.create({
        data: {
          userId,
          ...dto.shippingAddress,
        },
      });

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          subtotal,
          shippingFee,
          tax,
          total,
          shippingAddressId: shippingAddr.id,
          items: {
            create: lineItems.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              productSlug: item.productSlug,
              price: item.price,
              quantity: item.quantity,
              total: item.lineTotal,
              imageUrl: item.imageUrl,
            })),
          },
        },
        include: { items: true, shippingAddress: true },
      });

      // Atomically decrement stock with a stock >= quantity guard so two
      // concurrent orders cannot drive inventory negative (oversell). A
      // count of 0 means the inventory was consumed between the check above
      // and here, so we abort and roll back the whole transaction.
      for (const item of lineItems) {
        const result = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (result.count === 0) {
          throw new BadRequestException(`Insufficient stock for "${item.productName}"`);
        }
      }

      if (!dto.items && cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      return order;
    });

    return order;
  }

  async findAll(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        include: {
          items: true,
          shippingAddress: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: {
        items: {
          include: { product: { include: { images: { take: 1, orderBy: { order: "asc" } } } } },
        },
        shippingAddress: true,
        payment: true,
      },
    });

    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  async cancel(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: { items: true },
    });

    if (!order) throw new NotFoundException("Order not found");

    if (order.status !== "pending" && order.status !== "confirmed") {
      throw new BadRequestException(`Cannot cancel order in ${order.status} status`);
    }

    return await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status: "cancelled" },
      });

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      return updatedOrder;
    });
  }

  async requestRefund(userId: string, id: string, reason: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: { items: true },
    });

    if (!order) throw new NotFoundException("Order not found");

    // An order can only be refunded if it has been paid, delivered, etc.
    // Assuming 'delivered' or 'processing' are valid states for refund requests.
    if (order.status === "cancelled" || order.status === "refunded") {
      throw new BadRequestException(`Cannot request refund for order in ${order.status} status`);
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: "refund_requested" as any },
    });
  }
}
