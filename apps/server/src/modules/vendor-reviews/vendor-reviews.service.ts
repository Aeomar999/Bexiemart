import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class VendorReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getVendorId(userId: string) {
    const profile = await this.prisma.vendorProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException("Vendor profile not found");
    return profile.id;
  }

  async findAll(userId: string) {
    const vendorId = await this.getVendorId(userId);
    return this.prisma.review.findMany({
      where: { product: { vendorId } },
      include: { user: { select: { id: true, name: true, image: true } }, product: { select: { id: true, name: true, images: { take: 1, orderBy: { order: "asc" } } } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async reply(userId: string, reviewId: string, reply: string) {
    const vendorId = await this.getVendorId(userId);
    const review = await this.prisma.review.findFirst({ where: { id: reviewId, product: { vendorId } } });
    if (!review) throw new NotFoundException("Review not found");
    return this.prisma.review.update({ where: { id: reviewId }, data: { reply, replyAt: new Date() } });
  }
}
