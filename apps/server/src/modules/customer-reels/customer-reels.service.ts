import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CustomerReelsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string | undefined, cursor?: string) {
    const reels = await this.prisma.reel.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            vendorProfile: { select: { shopName: true, slug: true } },
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            images: { take: 1, orderBy: { order: "asc" } },
          },
        },
        // Only resolve per-user like state when we know who's asking. For a
        // guest (no userId) we skip the join entirely — a `where: { userId:
        // undefined }` filter would match *every* like and wrongly report
        // `liked: true`.
        likes: userId ? { where: { userId }, select: { id: true } } : false,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const data = reels.map(({ likes, ...rest }) => ({
      ...rest,
      liked: Array.isArray(likes) && likes.length > 0,
    }));
    const nextCursor = data.length === 20 ? data[19].id : null;
    return { data, meta: { nextCursor } };
  }

  async toggleLike(userId: string, reelId: string) {
    const reel = await this.prisma.reel.findUnique({ where: { id: reelId }, select: { id: true } });
    if (!reel) throw new NotFoundException("Reel not found");

    const existing = await this.prisma.reelLike.findUnique({
      where: { userId_reelId: { userId, reelId } },
    });

    if (existing) {
      await this.prisma.$transaction([
        this.prisma.reelLike.delete({ where: { id: existing.id } }),
        this.prisma.reel.update({ where: { id: reelId }, data: { likesCount: { decrement: 1 } } }),
      ]);
      return { liked: false };
    }

    await this.prisma.$transaction([
      this.prisma.reelLike.create({ data: { userId, reelId } }),
      this.prisma.reel.update({ where: { id: reelId }, data: { likesCount: { increment: 1 } } }),
    ]);
    return { liked: true };
  }

  async incrementView(reelId: string) {
    const reel = await this.prisma.reel.update({
      where: { id: reelId },
      data: { viewsCount: { increment: 1 } },
      select: { viewsCount: true },
    });
    return { viewsCount: reel.viewsCount };
  }

  async findFollowing(userId: string, cursor?: string) {
    const follows = await this.prisma.vendorFollow.findMany({
      where: { userId },
      select: { vendorId: true },
    });

    const vendorIds = follows.map((f) => f.vendorId);

    const reels = await this.prisma.reel.findMany({
      where: {
        isActive: true,
        user: { vendorProfile: { id: { in: vendorIds } } },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            vendorProfile: { select: { shopName: true, slug: true } },
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            images: { take: 1, orderBy: { order: "asc" } },
          },
        },
        likes: {
          where: { userId },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const data = reels.map(({ likes, ...rest }) => ({ ...rest, liked: likes.length > 0 }));
    const nextCursor = data.length === 20 ? data[19].id : null;
    return { data, meta: { nextCursor } };
  }
}
