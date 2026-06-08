import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async checkDatabase() {
    let status = "healthy";
    let latency: number | null = null;

    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      latency = Date.now() - start;
    } catch {
      status = "unhealthy";
    }

    return { status, latencyMs: latency };
  }
}
