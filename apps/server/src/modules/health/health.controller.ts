import { Controller, Get } from "@nestjs/common";
import { HealthService } from "./health.service";

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get("health")
  async check() {
    const database = await this.healthService.checkDatabase();

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database,
      memory: process.memoryUsage(),
    };
  }
}
