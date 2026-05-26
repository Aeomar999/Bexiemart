import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async validate(code: string, orderAmount: number) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code } });

    if (!coupon) throw new BadRequestException("Invalid coupon code");
    if (!coupon.isActive) throw new BadRequestException("Coupon is no longer active");
    if (coupon.expiresAt < new Date()) throw new BadRequestException("Coupon has expired");
    if (coupon.currentUses >= coupon.maxUses) throw new BadRequestException("Coupon has reached maximum uses");
    if (orderAmount < Number(coupon.minOrderAmount)) {
      throw new BadRequestException(`Minimum order amount of ₦${coupon.minOrderAmount} required`);
    }

    const discount = (Number(coupon.discountPercent) / 100) * orderAmount;

    return {
      valid: true,
      code: coupon.code,
      discountPercent: Number(coupon.discountPercent),
      discountAmount: Math.round(discount * 100) / 100,
    };
  }
}
