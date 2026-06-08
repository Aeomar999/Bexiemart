import { Injectable, NestMiddleware, Logger, BadRequestException } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class SsrfGuardMiddleware implements NestMiddleware {
  private readonly logger = new Logger("SsrfGuard");

  private readonly blockedHosts = [
    "169.254.169.254",
    "169.254.170.2",
    "127.0.0.1",
    "127.0.1.1",
    "127.0.0.53",
    "0.0.0.0",
    "localhost",
    "metadata.google.internal",
    "metadata",
  ];

  private readonly blockedRanges = [
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^127\./,
    /^0\./,
    /^169\.254\./,
    /^::1$/,
    /^fc00:/i,
    /^fe80:/i,
  ];

  isBlockedHost(host: string): boolean {
    const normalized = host.toLowerCase().split(":")[0];

    if (this.blockedHosts.includes(normalized)) return true;

    for (const range of this.blockedRanges) {
      if (range.test(normalized)) return true;
    }

    return false;
  }

  extractUrls(value: unknown): string[] {
    const urls: string[] = [];
    if (typeof value === "string") {
      if (value.startsWith("http://") || value.startsWith("https://")) {
        urls.push(value);
      }
    } else if (Array.isArray(value)) {
      for (const item of value) {
        urls.push(...this.extractUrls(item));
      }
    } else if (value !== null && typeof value === "object") {
      for (const val of Object.values(value as Record<string, unknown>)) {
        urls.push(...this.extractUrls(val));
      }
    }
    return urls;
  }

  checkForSsrf(obj: Record<string, unknown>, path = ""): string | null {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      if (typeof value === "string") {
        if (
          (value.startsWith("http://") || value.startsWith("https://")) &&
          value.includes("://")
        ) {
          try {
            const url = new URL(value);
            if (this.isBlockedHost(url.hostname)) {
              return currentPath;
            }
          } catch {
            continue;
          }
        }
      } else if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        const result = this.checkForSsrf(value as Record<string, unknown>, currentPath);
        if (result) return result;
      } else if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          const item = value[i];
          if (typeof item === "string") {
            if (
              (item.startsWith("http://") || item.startsWith("https://")) &&
              item.includes("://")
            ) {
              try {
                const url = new URL(item);
                if (this.isBlockedHost(url.hostname)) {
                  return `${currentPath}[${i}]`;
                }
              } catch {
                continue;
              }
            }
          } else if (item !== null && typeof item === "object") {
            const result = this.checkForSsrf(
              item as Record<string, unknown>,
              `${currentPath}[${i}]`
            );
            if (result) return result;
          }
        }
      }
    }
    return null;
  }

  use(req: Request, _res: Response, next: NextFunction) {
    try {
      if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
        const blockedField = this.checkForSsrf(req.body as Record<string, unknown>);
        if (blockedField) {
          this.logger.warn(
            `SSRF attempt blocked on ${req.method} ${req.originalUrl} at field: ${blockedField}`
          );
          throw new BadRequestException("Invalid URL reference");
        }
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`SSRF check error: ${error instanceof Error ? error.message : error}`);
    }

    next();
  }
}
