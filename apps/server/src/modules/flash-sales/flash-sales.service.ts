import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class FlashSalesService {
  constructor(private readonly prisma: PrismaService) {}

  async findActive() {
    const now = new Date();
    return this.prisma.flashSale.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { orderBy: { order: "asc" } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
