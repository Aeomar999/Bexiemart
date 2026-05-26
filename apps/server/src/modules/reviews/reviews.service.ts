import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateReviewDto } from "./dto/create-review.dto";

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, isActive: true, isDeleted: false },
    });
    if (!product) throw new NotFoundException("Product not found");

    return this.prisma.review.upsert({
      where: { userId_productId: { userId, productId: dto.productId } },
      update: { rating: dto.rating, comment: dto.comment },
      create: { userId, productId: dto.productId, rating: dto.rating, comment: dto.comment },
    });
  }

  async findByProduct(productId: string) {
    return this.prisma.review.findMany({
      where: { productId },
      include: { user: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async getProductStats(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException("Product not found");

    return this.prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { id: true },
    });
  }

  async remove(userId: string, id: string) {
    const review = await this.prisma.review.findFirst({ where: { id, userId } });
    if (!review) throw new NotFoundException("Review not found");

    await this.prisma.review.delete({ where: { id } });
    return { success: true };
  }
}
