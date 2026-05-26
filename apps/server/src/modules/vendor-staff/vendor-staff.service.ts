import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateStaffDto, UpdateStaffDto } from "./dto/staff.dto";

@Injectable()
export class VendorStaffService {
  constructor(private readonly prisma: PrismaService) {}

  private async getVendorId(userId: string) {
    const profile = await this.prisma.vendorProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException("Vendor profile not found");
    return profile.id;
  }

  async findAll(userId: string) {
    const vendorId = await this.getVendorId(userId);
    return this.prisma.vendorStaff.findMany({ where: { vendorId }, orderBy: { createdAt: "desc" } });
  }

  async create(userId: string, dto: CreateStaffDto) {
    const vendorId = await this.getVendorId(userId);
    const existing = await this.prisma.vendorStaff.findUnique({ where: { vendorId_email: { vendorId, email: dto.email } } });
    if (existing) throw new BadRequestException("Staff member with this email already exists");
    return this.prisma.vendorStaff.create({ data: { vendorId, name: dto.name, email: dto.email, role: dto.role, permissions: dto.permissions ?? [] } });
  }

  async update(userId: string, id: string, dto: UpdateStaffDto) {
    const vendorId = await this.getVendorId(userId);
    const staff = await this.prisma.vendorStaff.findFirst({ where: { id, vendorId } });
    if (!staff) throw new NotFoundException("Staff member not found");
    return this.prisma.vendorStaff.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const vendorId = await this.getVendorId(userId);
    const staff = await this.prisma.vendorStaff.findFirst({ where: { id, vendorId } });
    if (!staff) throw new NotFoundException("Staff member not found");
    await this.prisma.vendorStaff.delete({ where: { id } });
    return { success: true };
  }

  async toggle(userId: string, id: string) {
    const vendorId = await this.getVendorId(userId);
    const staff = await this.prisma.vendorStaff.findFirst({ where: { id, vendorId } });
    if (!staff) throw new NotFoundException("Staff member not found");
    return this.prisma.vendorStaff.update({ where: { id }, data: { isActive: !staff.isActive } });
  }
}
