import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async getWishlist(userId: string) {
    const items = await this.prisma.wishlist.findMany({
      where: { userId },
      include: { product: { include: { images: true, category: true } } },
      orderBy: { createdAt: "desc" },
    });
    return { data: items };
  }

  async toggleWishlist(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) throw new NotFoundException("Product not found");

    const existing = await this.prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      await this.prisma.wishlist.delete({ where: { id: existing.id } });
      return { message: "Removed from wishlist", isFavorited: false };
    }

    await this.prisma.wishlist.create({
      data: { userId, productId },
    });
    return { message: "Added to wishlist", isFavorited: true };
  }
}
