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
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Database check timeout")), 3000)
        ),
      ]);
      latency = Date.now() - start;
    } catch {
      status = "unhealthy";
    }

    return { status, latencyMs: latency };
  }
}
