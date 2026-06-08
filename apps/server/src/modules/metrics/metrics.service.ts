import { Injectable } from "@nestjs/common";
import * as os from "os";

@Injectable()
export class MetricsService {
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
