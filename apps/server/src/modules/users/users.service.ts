import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private select = {
    id: true,
    name: true,
    email: true,
    image: true,
    role: true,
    isSuperAdmin: true,
    onboardingCompleted: true,
    createdAt: true,
    updatedAt: true,
    vendorProfile: {
      select: { id: true, shopName: true, slug: true, logo: true, isActive: true },
    },
    wallet: {
      select: { id: true, balance: true, currency: true, status: true },
    },
  } as const;

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: this.select,
    });

    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: this.select,
    });
  }
}
