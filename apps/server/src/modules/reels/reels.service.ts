import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateReelDto, UpdateReelDto } from "./dto/create-reel.dto";

@Injectable()
export class ReelsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const profile = await this.prisma.vendorProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException("Vendor profile not found");
    return this.prisma.reel.findMany({
      where: { userId, isActive: true },
      include: { product: { select: { id: true, name: true, price: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(userId: string, id: string) {
    const reel = await this.prisma.reel.findFirst({
      where: { id, userId },
      include: { product: { select: { id: true, name: true, price: true } } },
    });
    if (!reel) throw new NotFoundException("Reel not found");
    return reel;
  }

  async create(userId: string, dto: CreateReelDto) {
    return this.prisma.reel.create({
      data: {
        userId,
        videoUrl: dto.videoUrl,
        thumbnailUrl: dto.thumbnailUrl,
        caption: dto.caption,
        productId: dto.productId,
      },
      include: { product: { select: { id: true, name: true, price: true } } },
    });
  }

  async update(userId: string, id: string, dto: UpdateReelDto) {
    const reel = await this.prisma.reel.findFirst({ where: { id, userId } });
    if (!reel) throw new NotFoundException("Reel not found");
    return this.prisma.reel.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const reel = await this.prisma.reel.findFirst({ where: { id, userId } });
    if (!reel) throw new NotFoundException("Reel not found");
    await this.prisma.reel.update({ where: { id }, data: { isActive: false } });
    return { success: true };
  }
}
