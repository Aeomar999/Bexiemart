import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import * as os from "os";

@ApiTags("Metrics")
@Controller("metrics")
export class MetricsController {
  @ApiOperation({ summary: "Get system metrics" })
  @Get()
  getMetrics() {
    return {
      uptime: process.uptime(),
      timestamp: Date.now(),
      memory: process.memoryUsage(),
      cpu: os.loadavg(),
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
    };
  }
}
