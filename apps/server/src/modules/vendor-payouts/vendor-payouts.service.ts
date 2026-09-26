import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import { EscrowService } from "../escrow/escrow.service";

@Injectable()
export class VendorPayoutsService {
  private readonly logger = new Logger(VendorPayoutsService.name);
  private readonly paystackBaseUrl = "https://api.paystack.co";

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly escrow: EscrowService
  ) {}

  private get paystackSecretKey(): string {
    return this.config.get<string>("PAYSTACK_SECRET_KEY", "");
  }

  private async paystackPost<T = any>(path: string, body: Record<string, any>): Promise<T> {
    const response = await fetch(`${this.paystackBaseUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok || !data.status) {
      this.logger.error(`Paystack POST ${path} failed: ${JSON.stringify(data)}`);
      throw new Error(data.message || "Paystack request failed");
    }
    return data.data;
  }

  @Cron(CronExpression.EVERY_WEEKEND)
  async processPayouts() {
    this.logger.log("Starting weekly vendor payouts...");

    const platformConfig = await this.prisma.platformConfig.findFirst();
    const fee = platformConfig ? Number(platformConfig.withdrawalFeeFlat) : 2.0;
    const minWithdrawal = Number(platformConfig?.minWithdrawal ?? 10);

    // Get all vendor wallets with balance >= minWithdrawal + fee
    const vendors = await this.prisma.vendorProfile.findMany({
      where: {
        user: {
          wallet: {
            balance: { gte: minWithdrawal + fee },
          },
        },
      },
      include: {
        user: {
          include: {
            wallet: {
              include: {
                bankAccounts: true,
                momoAccounts: true,
              },
            },
          },
        },
      },
    });

    if (vendors.length === 0) {
      this.logger.log("No vendors eligible for payout this week.");
      return { success: true, count: 0 };
    }

    const transfers = [];
    const reservations = [];

    for (const vendor of vendors) {
      const wallet = vendor.user.wallet;
      if (!wallet) continue;

      // Find a default or first available payout account
      const bankAccount = wallet.bankAccounts.find((a) => a.isDefault) || wallet.bankAccounts[0];
      const momoAccount = wallet.momoAccounts.find((a) => a.isDefault) || wallet.momoAccounts[0];

      const account = bankAccount || momoAccount;
      if (!account || !account.paystackRecipientCode) {
        this.logger.warn(`Vendor ${vendor.shopName} has no valid payout account linked. Skipping.`);
        continue;
      }

      // Calculate amount to withdraw (all of it, minus fee)
      const balance = Number(wallet.balance);
      const totalDeduction = balance; // We drain the wallet
      const payoutAmount = balance - fee; // What they actually receive

      const reference = `po_${wallet.id.substring(0, 8)}_${Date.now()}`;

      // Reserve funds locally before queueing transfer
      const reserved = await this.prisma.$transaction(
        async (tx) => {
          const claim = await tx.wallet.updateMany({
            where: { id: wallet.id, balance: { gte: totalDeduction } },
            data: { balance: { decrement: totalDeduction } },
          });
          if (claim.count === 0) return null;
          return tx.transaction.create({
            data: {
              walletId: wallet.id,
              type: "WITHDRAWAL",
              status: "PENDING",
              amount: totalDeduction,
              fee,
              netAmount: payoutAmount,
              reference,
              description: `Weekly automated payout`,
            },
          });
        },
        { isolationLevel: "Serializable" }
      );

      if (reserved) {
        reservations.push({
          walletId: wallet.id,
          transactionId: reserved.id,
          totalDeduction,
        });

        transfers.push({
          amount: Math.round(payoutAmount * 100), // in pesewas
          recipient: account.paystackRecipientCode,
          reference,
          reason: "Weekly Earnings Payout",
        });
      }
    }

    if (transfers.length === 0) {
      this.logger.log("No valid transfers to process.");
      return { success: true, count: 0 };
    }

    // Trigger Bulk Transfer via Paystack
    try {
      this.logger.log(`Initiating bulk transfer for ${transfers.length} vendors...`);
      const response = await this.paystackPost("/transfer/bulk", {
        currency: "GHS",
        source: "balance",
        transfers,
      });

      // Update local transactions with Paystack's bulk reference or transfer codes if available
      // Webhooks will handle the actual SUCCESS/FAILED updates later.
      this.logger.log(`Bulk transfer initiated successfully. Paystack response:`, response);

      return { success: true, count: transfers.length };
    } catch (err) {
      this.logger.error("Bulk transfer failed! Reversing reservations...", err);

      // Reverse reservations
      for (const res of reservations) {
        await this.prisma.$transaction([
          this.prisma.wallet.update({
            where: { id: res.walletId },
            data: { balance: { increment: res.totalDeduction } },
          }),
          this.prisma.transaction.update({
            where: { id: res.transactionId },
            data: { status: "FAILED" },
          }),
        ]);
      }

      throw err;
    }
  }

  /**
   * Auto-release escrow after delivery confirmation window passes.
   * Runs every 6 hours.
   * - 72h after order marked 'delivered' (if buyer hasn't confirmed)
   * - 14 days after order marked 'shipped' (if never delivered, no dispute)
   */
  @Cron("0 */6 * * *") // Every 6 hours
  async autoReleaseEscrow() {
    this.logger.log("Running auto-release escrow check...");

    const escrows = await this.prisma.escrow.findMany({
      where: {
        status: "HELD",
        order: {
          status: { in: ["delivered", "shipped"] },
        },
      },
      include: { order: true, vendor: true },
    });

    let released = 0;
    for (const escrow of escrows) {
      const order = escrow.order;
      if (!order) continue;

      const now = Date.now();
      const updatedAt = order.updatedAt ? new Date(order.updatedAt).getTime() : 0;
      const hoursSinceUpdate = (now - updatedAt) / (1000 * 60 * 60);
      const daysSinceUpdate = hoursSinceUpdate / 24;

      let shouldRelease = false;

      if (order.status === "delivered" && hoursSinceUpdate >= 72) {
        // 72 hours after delivered, buyer hasn't confirmed
        shouldRelease = true;
      } else if (order.status === "shipped" && daysSinceUpdate >= 14) {
        // 14 days after shipped, never delivered, no dispute
        // Check no dispute exists
        const dispute = await this.prisma.escrow.findFirst({
          where: { orderId: order.id, status: "DISPUTED" },
        });
        if (!dispute) shouldRelease = true;
      }

      if (shouldRelease) {
        try {
          await this.escrow.releaseForDelivery(escrow.id);
          released++;
          this.logger.log(`Auto-released escrow ${escrow.id} for order ${order.id}`);
        } catch (err) {
          this.logger.error(`Failed to auto-release escrow ${escrow.id}`, err);
        }
      }
    }

    this.logger.log(`Auto-release complete: ${released} escrows released`);
    return { success: true, released };
  }

  /**
   * Auto-refund escrow if order never shipped after 14 days.
   * Runs daily at 2 AM.
   */
  @Cron("0 2 * * *") // Daily at 2 AM
  async autoRefundEscrow() {
    this.logger.log("Running auto-refund escrow check...");

    const escrows = await this.prisma.escrow.findMany({
      where: {
        status: "HELD",
        order: {
          status: "confirmed",
        },
      },
      include: { order: true },
    });

    let refunded = 0;
    for (const escrow of escrows) {
      const order = escrow.order;
      if (!order) continue;

      const now = Date.now();
      const updatedAt = order.updatedAt ? new Date(order.updatedAt).getTime() : 0;
      const daysSinceConfirmed = (now - updatedAt) / (1000 * 60 * 60 * 24);

      // Check no dispute exists
      const dispute = await this.prisma.escrow.findFirst({
        where: { orderId: order.id, status: "DISPUTED" },
      });
      if (dispute) continue;

      if (daysSinceConfirmed >= 14) {
        try {
          await this.escrow.refundForCancellation(escrow.id);
          refunded++;
          this.logger.log(`Auto-refunded escrow ${escrow.id} for order ${order.id}`);
        } catch (err) {
          this.logger.error(`Failed to auto-refund escrow ${escrow.id}`, err);
        }
      }
    }

    this.logger.log(`Auto-refund complete: ${refunded} escrows refunded`);
    return { success: true, refunded };
  }
}
