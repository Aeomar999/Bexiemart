import { Injectable, Optional } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PostHogService } from "../posthog/posthog.service";

@Injectable()
export class FlashSalesService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly posthogService?: PostHogService
  ) {}

  async findActive() {
    if (this.posthogService) {
      const isEnabled = await this.posthogService.isFeatureEnabled("flash-sales-active", "server");
      if (!isEnabled) {
        return [];
      }
    }
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
