import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class StoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveStories(userId: string, targetVendorId?: string) {
    const now = new Date();
    
    // In a real app, this might just fetch stories from followed vendors.
    // For now, if targetVendorId is provided, fetch their stories, 
    // otherwise fetch all active stories.
    const whereClause: any = {
      expiresAt: { gt: now },
    };

    if (targetVendorId) {
      // Find the user ID corresponding to this vendor ID
      const vendor = await this.prisma.vendorProfile.findUnique({
        where: { id: targetVendorId }
      });
      if (vendor) {
        whereClause.userId = vendor.userId;
      } else {
        return [];
      }
    }

    const stories = await this.prisma.story.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            vendorProfile: {
              select: { id: true, shopName: true, logo: true }
            }
          }
        },
        views: {
            where: { viewerId: userId },
            select: { id: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    // Group stories by user/vendor
    const grouped = new Map();
    for (const story of stories) {
        const uId = story.userId;
        if (!grouped.has(uId)) {
            grouped.set(uId, {
                userId: uId,
                vendor: story.user.vendorProfile || { shopName: story.user.name, logo: story.user.image },
                stories: [],
                allViewed: true
            });
        }
        
        const isViewed = story.views.length > 0;
        if (!isViewed) grouped.get(uId).allViewed = false;
        
        grouped.get(uId).stories.push({
            id: story.id,
            mediaUrl: story.mediaUrl,
            caption: story.caption,
            createdAt: story.createdAt,
            expiresAt: story.expiresAt,
            isViewed
        });
    }

    return Array.from(grouped.values());
  }

  async createStory(userId: string, data: { mediaUrl: string; caption?: string }) {
    if (!data.mediaUrl) {
      throw new BadRequestException("mediaUrl is required");
    }

    // Story expires in 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return this.prisma.story.create({
      data: {
        userId,
        mediaUrl: data.mediaUrl,
        caption: data.caption,
        expiresAt,
      },
    });
  }

  async deleteStory(userId: string, id: string) {
    const story = await this.prisma.story.findUnique({ where: { id } });
    if (!story) throw new NotFoundException("Story not found");
    if (story.userId !== userId) throw new ForbiddenException("Not your story");

    await this.prisma.story.delete({ where: { id } });
    return { success: true };
  }

  async recordView(userId: string, storyId: string) {
    const story = await this.prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw new NotFoundException("Story not found");

    if (story.userId === userId) {
      return { success: true, message: "Own story view not recorded" };
    }

    try {
      await this.prisma.storyView.create({
        data: {
          storyId,
          viewerId: userId,
        },
      });
    } catch (err) {
      // Ignore if already viewed (unique constraint)
    }

    return { success: true };
  }
}
