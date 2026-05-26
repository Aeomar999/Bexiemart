import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/create-service.dto";

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  private async getVendorId(userId: string) {
    const profile = await this.prisma.vendorProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException("Vendor profile not found");
    return profile.id;
  }

  async findAll(userId: string) {
    const vendorId = await this.getVendorId(userId);
    return this.prisma.service.findMany({ where: { vendorId }, orderBy: { createdAt: "desc" } });
  }

  async findOne(userId: string, id: string) {
    const vendorId = await this.getVendorId(userId);
    const service = await this.prisma.service.findFirst({ where: { id, vendorId } });
    if (!service) throw new NotFoundException("Service not found");
    return service;
  }

  async create(userId: string, dto: CreateServiceDto) {
    const vendorId = await this.getVendorId(userId);
    return this.prisma.service.create({
      data: { ...dto, vendorId, rating: 0, ratingCount: 0 },
    });
  }

  async update(userId: string, id: string, dto: UpdateServiceDto) {
    const vendorId = await this.getVendorId(userId);
    const existing = await this.prisma.service.findFirst({ where: { id, vendorId } });
    if (!existing) throw new NotFoundException("Service not found");
    return this.prisma.service.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const vendorId = await this.getVendorId(userId);
    const existing = await this.prisma.service.findFirst({ where: { id, vendorId } });
    if (!existing) throw new NotFoundException("Service not found");
    await this.prisma.service.delete({ where: { id } });
    return { success: true };
  }
}
