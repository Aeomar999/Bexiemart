import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateAddressDto } from "./dto/create-address.dto";
import { UpdateAddressDto } from "./dto/update-address.dto";

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }

  async create(userId: string, dto: CreateAddressDto) {
    if (dto.isDefault) {
      await this.prisma.userAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const isFirst = (await this.prisma.userAddress.count({ where: { userId } })) === 0;

    return this.prisma.userAddress.create({
      data: {
        userId,
        type: dto.type,
        name: dto.name,
        address: dto.address,
        city: dto.city,
        phone: dto.phone,
        isDefault: dto.isDefault ?? isFirst,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateAddressDto) {
    const address = await this.prisma.userAddress.findFirst({
      where: { id, userId },
    });

    if (!address) throw new NotFoundException("Address not found");

    if (dto.isDefault) {
      await this.prisma.userAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.userAddress.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: string, id: string) {
    const address = await this.prisma.userAddress.findFirst({
      where: { id, userId },
    });

    if (!address) throw new NotFoundException("Address not found");

    await this.prisma.userAddress.delete({ where: { id } });

    if (address.isDefault) {
      const next = await this.prisma.userAddress.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      if (next) {
        await this.prisma.userAddress.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }

    return { success: true };
  }

  async setDefault(userId: string, id: string) {
    const address = await this.prisma.userAddress.findFirst({
      where: { id, userId },
    });

    if (!address) throw new NotFoundException("Address not found");

    await this.prisma.userAddress.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    return this.prisma.userAddress.update({
      where: { id },
      data: { isDefault: true },
    });
  }
}
