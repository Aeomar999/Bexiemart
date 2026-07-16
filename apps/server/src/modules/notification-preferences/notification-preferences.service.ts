import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { UpdatePreferencesDto } from "./dto/update-preferences.dto";

@Injectable()
export class NotificationPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string) {
    const row = await this.prisma.notificationPreference.findUnique({ where: { userId } });
    if (row) return row;
    return this.prisma.notificationPreference.create({ data: { userId } });
  }

  async update(userId: string, dto: UpdatePreferencesDto) {
    await this.get(userId);
    return this.prisma.notificationPreference.update({ where: { userId }, data: dto });
  }
}
