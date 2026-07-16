import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { Prisma } from "@prisma/client";

const COINS_PER_GHS = 100;

@Injectable()
export class LoyaltyService {
  constructor(private readonly prisma: PrismaService) {}

  /** Grant coins inside an existing transaction (e.g. on order delivery). */
  async grantCoins(tx: Prisma.TransactionClient, walletId: string, coins: number, _reason: string) {
    if (coins <= 0) return;
    await tx.wallet.update({ where: { id: walletId }, data: { bexieCoins: { increment: coins } } });
  }

  async getSummary(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    const [user, topups, orders, referred] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { onboardingCompleted: true } }),
      wallet
        ? this.prisma.transaction.count({
            where: { walletId: wallet.id, type: "TOPUP", status: "COMPLETED" },
          })
        : Promise.resolve(0),
      this.prisma.order.count({ where: { userId, status: "delivered" } }),
      this.prisma.referredUser.count({ where: { referral: { userId } } }),
    ]);
    return {
      balance: wallet?.bexieCoins ?? 0,
      ratePerCoin: 1 / COINS_PER_GHS,
      earn: {
        completeProfile: !!user?.onboardingCompleted,
        firstTopup: topups > 0,
        orders,
        referrals: referred,
      },
    };
  }

  async convertCoinsToBalance(userId: string, coins: number) {
    if (!Number.isInteger(coins) || coins <= 0)
      throw new BadRequestException("Invalid coin amount");
    if (coins % COINS_PER_GHS !== 0)
      throw new BadRequestException(`Convert in multiples of ${COINS_PER_GHS} coins`);

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new NotFoundException("Wallet not found");
      if (wallet.bexieCoins < coins) throw new BadRequestException("Not enough coins");

      const cash = coins / COINS_PER_GHS;
      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { bexieCoins: { decrement: coins }, balance: { increment: cash } },
      });
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: "TOPUP",
          status: "COMPLETED",
          amount: cash,
          netAmount: cash,
          reference: `coins_${wallet.id.substring(0, 8)}_${coins}_${wallet.bexieCoins}`,
          description: `Converted ${coins} BexieCoins`,
        },
      });
      return { coinsBalance: updated.bexieCoins, walletBalance: Number(updated.balance) };
    });
  }
}
