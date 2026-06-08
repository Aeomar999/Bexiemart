import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { MetricsService } from "./metrics.service";

@ApiTags("Metrics")
@Controller("metrics")
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @ApiOperation({ summary: "Get system metrics" })
  @Get()
  getMetrics() {
    return this.metricsService.getMetrics();
  }
}
