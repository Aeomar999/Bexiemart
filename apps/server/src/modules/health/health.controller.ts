import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Version,
  VERSION_NEUTRAL,
} from "@nestjs/common";
import { HealthService } from "./health.service";
import { AuthenticatedRequest } from "../../types/request.types";

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get(["health", "api/health", "api/v1/health"])
  @Version([VERSION_NEUTRAL, "1"])
  async check() {
    const database = await this.healthService.checkDatabase();
    const status = database.status === "healthy" ? "ok" : "error";

    const payload = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database,
      memory: process.memoryUsage(),
    };

    if (database.status !== "healthy") {
      throw new HttpException(payload, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return payload;
  }
}
