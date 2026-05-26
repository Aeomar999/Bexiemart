import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class VendorDocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getVendorId(userId: string) {
    const profile = await this.prisma.vendorProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException("Vendor profile not found");
    return profile.id;
  }

  async findAll(userId: string) {
    const vendorId = await this.getVendorId(userId);
    return this.prisma.vendorDocument.findMany({ where: { vendorId }, orderBy: { createdAt: "desc" } });
  }

  async create(userId: string, data: { name: string; url: string; type: string }) {
    const vendorId = await this.getVendorId(userId);
    return this.prisma.vendorDocument.create({ data: { vendorId, name: data.name, url: data.url, type: data.type } });
  }

  async remove(userId: string, id: string) {
    const vendorId = await this.getVendorId(userId);
    const doc = await this.prisma.vendorDocument.findFirst({ where: { id, vendorId } });
    if (!doc) throw new NotFoundException("Document not found");
    await this.prisma.vendorDocument.delete({ where: { id } });
    return { success: true };
  }
}
