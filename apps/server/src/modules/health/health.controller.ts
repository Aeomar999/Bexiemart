import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("health")
  async check() {
    let dbStatus = "healthy";
    let dbLatency: number | null = null;

    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - start;
    } catch {
      dbStatus = "unhealthy";
    }

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        latencyMs: dbLatency,
      },
      memory: process.memoryUsage(),
    };
  }
}
