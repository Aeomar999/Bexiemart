import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ReferralsService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(userId: string) {
    const existing = await this.prisma.referral.findUnique({ where: { userId } });
    if (existing) return existing;

    const code = await this.generateUniqueCode();

    return this.prisma.referral.create({
      data: { userId, code },
    });
  }

  async getMyReferral(userId: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { userId },
      include: {
        referredUsers: {
          include: {
            referredUser: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
      },
    });

    if (!referral) throw new NotFoundException("Referral not found");

    return referral;
  }

  async apply(userId: string, code: string) {
    const referral = await this.prisma.referral.findUnique({ where: { code } });
    if (!referral) throw new NotFoundException("Invalid referral code");

    if (referral.userId === userId) {
      throw new BadRequestException("Cannot apply your own referral code");
    }

    const existing = await this.prisma.referredUser.findUnique({
      where: { referredUserId: userId },
    });
    if (existing) {
      throw new BadRequestException("You have already been referred");
    }

    await this.prisma.referredUser.create({
      data: {
        referralId: referral.id,
        referredUserId: userId,
      },
    });

    return { message: "Referral code applied successfully" };
  }

  async getStats(userId: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { userId },
      include: {
        referredUsers: true,
      },
    });

    if (!referral) throw new NotFoundException("Referral not found");

    const completed = referral.referredUsers.filter(
      (u: any) => u.status === "COMPLETED",
    );

    return {
      totalReferrals: referral.referredUsers.length,
      completedCount: completed.length,
      totalRewardsEarned: referral.rewardAmount,
    };
  }

  private async generateUniqueCode(): Promise<string> {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let code: string;
    let exists = true;

    while (exists) {
      code = "";
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      exists = !!(await this.prisma.referral.findUnique({ where: { code } }));
    }

    return code!;
  }
}
