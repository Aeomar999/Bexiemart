import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: { include: { vendor: { select: { id: true, shopName: true } }, images: { take: 1, orderBy: { order: "asc" } } } } } } },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: { items: { include: { product: { include: { vendor: { select: { id: true, shopName: true } }, images: { take: 1, orderBy: { order: "asc" } } } } } } },
      });
    }

    return cart;
  }

  private mapCartResponse(cart: any) {
    const items = cart.items.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      name: item.productName,
      price: Number(item.price),
      quantity: item.quantity,
      imageUrl: item.product?.images?.[0]?.url ?? null,
      stock: item.product?.stock ?? 0,
      vendorId: item.product?.vendor?.id ?? null,
      vendorName: item.product?.vendor?.shopName ?? "Unknown Store",
    }));

    return {
      items,
      itemCount: items.reduce((s: number, i: any) => s + i.quantity, 0),
      subtotal: items.reduce((s: number, i: any) => s + i.price * i.quantity, 0),
    };
  }

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    return this.mapCartResponse(cart);
  }

  async addItem(userId: string, productId: string, quantity: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId, isActive: true, isDeleted: false },
    });

    if (!product) throw new NotFoundException("Product not found");
    if (product.stock < quantity) throw new BadRequestException("Insufficient stock");

    const cart = await this.getOrCreateCart(userId);

    const existing = cart.items.find((i: any) => i.productId === productId);

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > product.stock) throw new BadRequestException("Insufficient stock");

      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty, price: product.price },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          productName: product.name,
          price: product.price,
          quantity,
        },
      });
    }

    return { success: true };
  }

  async updateItem(userId: string, itemId: string, quantity: number) {
    const cart = await this.getOrCreateCart(userId);
    const item = cart.items.find((i: any) => i.id === itemId);

    if (!item) throw new NotFoundException("Cart item not found");

    const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
    if (!product) throw new NotFoundException("Product not found");
    if (quantity > product.stock) throw new BadRequestException("Insufficient stock");

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return { success: true };
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);
    const item = cart.items.find((i: any) => i.id === itemId);

    if (!item) throw new NotFoundException("Cart item not found");

    await this.prisma.cartItem.delete({ where: { id: itemId } });

    return { success: true };
  }
}
