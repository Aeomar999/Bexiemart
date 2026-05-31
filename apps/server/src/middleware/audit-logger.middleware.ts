import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class AuditLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger("Audit");

  // Define sensitive routes that require audit logging
  private readonly sensitiveRoutes = [
    "/wallet/withdraw",
    "/wallet/transfer",
    "/admin/resolve-dispute",
    "/auth/login",
    "/auth/register"
  ];

  use(req: Request, res: Response, next: NextFunction) {
    const isSensitive = this.sensitiveRoutes.some((route) => req.baseUrl.includes(route) || req.path.includes(route));

    if (isSensitive) {
      const start = Date.now();
      res.on("finish", () => {
        const duration = Date.now() - start;
        const userId = (req as any).user?.id || "anonymous";
        const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
        const userAgent = req.headers["user-agent"] || "unknown";

        this.logger.log(
          `[AUDIT] User: ${userId} | IP: ${ip} | Action: ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | Duration: ${duration}ms | Agent: ${userAgent}`
        );
      });
    }

    next();
  }
}
