import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class VendorHoursService {
  constructor(private readonly prisma: PrismaService) {}

  private async getVendorId(userId: string) {
    const profile = await this.prisma.vendorProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException("Vendor profile not found");
    return profile.id;
  }

  async findAll(userId: string) {
    const vendorId = await this.getVendorId(userId);
    let hours = await this.prisma.vendorHours.findMany({ where: { vendorId }, orderBy: { day: "asc" } });
    if (hours.length === 0) {
      const defaults = Array.from({ length: 7 }, (_, i) => ({ vendorId, day: i, isOpen: i !== 0, openTime: i !== 0 ? "09:00" : null, closeTime: i !== 0 ? "17:00" : null }));
      await this.prisma.vendorHours.createMany({ data: defaults });
      hours = await this.prisma.vendorHours.findMany({ where: { vendorId }, orderBy: { day: "asc" } });
    }
    return hours;
  }

  async update(userId: string, data: { day: number; isOpen: boolean; openTime?: string; closeTime?: string }[]) {
    const vendorId = await this.getVendorId(userId);
    for (const entry of data) {
      await this.prisma.vendorHours.upsert({
        where: { vendorId_day: { vendorId, day: entry.day } },
        update: { isOpen: entry.isOpen, openTime: entry.openTime, closeTime: entry.closeTime },
        create: { vendorId, day: entry.day, isOpen: entry.isOpen, openTime: entry.openTime, closeTime: entry.closeTime },
      });
    }
    return this.prisma.vendorHours.findMany({ where: { vendorId }, orderBy: { day: "asc" } });
  }
}
