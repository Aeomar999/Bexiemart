import { Injectable, NotFoundException } from "@nestjs/common";
import { BannerPlacement, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateBannerDto } from "./dto/create-banner.dto";
import { UpdateBannerDto } from "./dto/update-banner.dto";

@Injectable()
export class BannersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Public: active banners for a placement, honouring the optional schedule
   * window (startsAt/endsAt), ordered for display. Served to guests too.
   */
  findActive(placement: BannerPlacement) {
    const now = new Date();
    return this.prisma.banner.findMany({
      where: {
        placement,
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  }

  /** Admin: paginated list of all banners, optionally filtered by placement. */
  async list(page = 1, limit = 20, placement?: BannerPlacement) {
    const where: Prisma.BannerWhereInput = placement ? { placement } : {};
    const [data, total] = await Promise.all([
      this.prisma.banner.findMany({
        where,
        orderBy: [{ placement: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.banner.count({ where }),
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  create(dto: CreateBannerDto) {
    return this.prisma.banner.create({
      data: this.toData(dto) as Prisma.BannerCreateInput,
    });
  }

  async update(id: string, dto: UpdateBannerDto) {
    await this.ensureExists(id);
    return this.prisma.banner.update({
      where: { id },
      data: this.toData(dto) as Prisma.BannerUpdateInput,
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.banner.delete({ where: { id } });
    return { success: true };
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.banner.findUnique({ where: { id } });
    if (!found) throw new NotFoundException("Banner not found");
  }

  /** Normalises incoming date strings to Date objects for Prisma. */
  private toData(dto: CreateBannerDto | UpdateBannerDto) {
    const { startsAt, endsAt, ...rest } = dto;
    return {
      ...rest,
      ...(startsAt !== undefined ? { startsAt: startsAt ? new Date(startsAt) : null } : {}),
      ...(endsAt !== undefined ? { endsAt: endsAt ? new Date(endsAt) : null } : {}),
    };
  }
}
