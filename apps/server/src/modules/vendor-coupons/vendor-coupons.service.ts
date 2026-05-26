import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateVendorCouponDto, UpdateVendorCouponDto } from "./dto/vendor-coupon.dto";

@Injectable()
export class VendorCouponsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getVendorId(userId: string) {
    const profile = await this.prisma.vendorProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException("Vendor profile not found");
    return profile.id;
  }

  async findAll(userId: string) {
    const vendorId = await this.getVendorId(userId);
    return this.prisma.coupon.findMany({ where: { vendorId }, orderBy: { createdAt: "desc" } });
  }

  async create(userId: string, dto: CreateVendorCouponDto) {
    const vendorId = await this.getVendorId(userId);
    const existing = await this.prisma.coupon.findUnique({ where: { code: dto.code } });
    if (existing) throw new BadRequestException("Coupon code already exists");
    return this.prisma.coupon.create({
      data: { vendorId, code: dto.code.toUpperCase(), discountPercent: dto.discountPercent, minOrderAmount: dto.minOrderAmount ?? 0, maxUses: dto.maxUses ?? 100, expiresAt: new Date(dto.expiresAt) },
    });
  }

  async update(userId: string, id: string, dto: UpdateVendorCouponDto) {
    const vendorId = await this.getVendorId(userId);
    const coupon = await this.prisma.coupon.findFirst({ where: { id, vendorId } });
    if (!coupon) throw new NotFoundException("Coupon not found");
    return this.prisma.coupon.update({ where: { id }, data: { ...dto, expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined } });
  }

  async remove(userId: string, id: string) {
    const vendorId = await this.getVendorId(userId);
    const coupon = await this.prisma.coupon.findFirst({ where: { id, vendorId } });
    if (!coupon) throw new NotFoundException("Coupon not found");
    await this.prisma.coupon.delete({ where: { id } });
    return { success: true };
  }

  async toggle(userId: string, id: string) {
    const vendorId = await this.getVendorId(userId);
    const coupon = await this.prisma.coupon.findFirst({ where: { id, vendorId } });
    if (!coupon) throw new NotFoundException("Coupon not found");
    return this.prisma.coupon.update({ where: { id }, data: { isActive: !coupon.isActive } });
  }
}
