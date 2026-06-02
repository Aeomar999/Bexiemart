import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserCollections(userId: string) {
    const collections = await this.prisma.collection.findMany({
      where: { userId },
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return { data: collections };
  }

  async getCollection(userId: string, id: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { include: { images: true, category: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!collection || collection.userId !== userId) {
      throw new NotFoundException("Collection not found");
    }

    return { data: collection };
  }

  async createCollection(userId: string, name: string, description?: string) {
    try {
      const collection = await this.prisma.collection.create({
        data: {
          userId,
          name,
          description,
        },
      });
      return { data: collection };
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new ConflictException("A collection with this name already exists");
      }
      throw error;
    }
  }

  async deleteCollection(userId: string, id: string) {
    const collection = await this.prisma.collection.findUnique({ where: { id } });
    if (!collection || collection.userId !== userId) {
      throw new NotFoundException("Collection not found");
    }

    await this.prisma.collection.delete({ where: { id } });
    return { message: "Collection deleted" };
  }

  async addItemToCollection(userId: string, collectionId: string, productId: string) {
    const collection = await this.prisma.collection.findUnique({ where: { id: collectionId } });
    if (!collection || collection.userId !== userId) {
      throw new NotFoundException("Collection not found");
    }

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException("Product not found");

    try {
      await this.prisma.collectionItem.create({
        data: {
          collectionId,
          productId,
        },
      });
      return { message: "Item added to collection" };
    } catch (error: any) {
      if (error.code === "P2002") {
        return { message: "Item already in collection" };
      }
      throw error;
    }
  }

  async removeItemFromCollection(userId: string, collectionId: string, productId: string) {
    const collection = await this.prisma.collection.findUnique({ where: { id: collectionId } });
    if (!collection || collection.userId !== userId) {
      throw new NotFoundException("Collection not found");
    }

    const item = await this.prisma.collectionItem.findUnique({
      where: {
        collectionId_productId: { collectionId, productId },
      },
    });

    if (item) {
      await this.prisma.collectionItem.delete({ where: { id: item.id } });
    }

    return { message: "Item removed from collection" };
  }
}
