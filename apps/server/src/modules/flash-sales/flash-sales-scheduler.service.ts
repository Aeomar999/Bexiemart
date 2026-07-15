import { Injectable, Logger, Optional } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../prisma/prisma.service";
import { PostHogService } from "../posthog/posthog.service";

@Injectable()
export class FlashSalesSchedulerService {
  private readonly logger = new Logger(FlashSalesSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly posthogService?: PostHogService
  ) {}

  /**
   * Periodic cron job running every minute to manage flash sale lifecycle events.
   * Auto-deactivates flash sales that have passed their endDate.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron(): Promise<void> {
    if (this.posthogService) {
      const isEnabled = await this.posthogService.isFeatureEnabled(
        "flash-sales-scheduler",
        "server"
      );
      if (isEnabled === false) {
        this.logger.debug(
          "Flash sales scheduler skipped: feature flag flash-sales-scheduler is disabled"
        );
        return;
      }
    }

    await this.deactivateExpiredFlashSales();
  }

  /**
   * Finds and deactivates all flash sales where isActive is true and endDate <= now.
   */
  async deactivateExpiredFlashSales(): Promise<number> {
    const now = new Date();
    const expiredSales = await this.prisma.flashSale.findMany({
      where: {
        isActive: true,
        endDate: { lte: now },
      },
      select: { id: true, title: true, endDate: true },
    });

    if (expiredSales.length === 0) {
      return 0;
    }

    const expiredIds = expiredSales.map((sale) => sale.id);
    const result = await this.prisma.flashSale.updateMany({
      where: {
        id: { in: expiredIds },
      },
      data: {
        isActive: false,
      },
    });

    this.logger.log(
      `Deactivated ${result.count} expired flash sales: ${expiredSales.map((s) => `"${s.title}" (${s.id})`).join(", ")}`
    );

    return result.count;
  }
}
