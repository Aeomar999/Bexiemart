import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class InputSanitizerMiddleware implements NestMiddleware {
  private readonly logger = new Logger("InputSanitizer");

  private readonly xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript\s*:/gi,
    /on\w+\s*=\s*["'][^"']*["']/gi,
    /on\w+\s*=\s*[^\s>]+/gi,
    /<iframe\b[^>]*>/gi,
    /<embed\b[^>]*>/gi,
    /<object\b[^>]*>/gi,
    /<svg\b[^>]*>/gi,
    /<math\b[^>]*>/gi,
    /<style\b[^>]*>/gi,
    /expression\s*\(/gi,
    /url\s*\(\s*["']?\s*javascript:/gi,
  ];

  private readonly sqlPatterns = [
    /\bOR\b.{0,20}\b\d{1,3}\s*=\s*\d{1,3}/gi,
    /\bOR\b.{0,20}['"]\s*=\s*['"]/gi,
    /\bAND\b.{0,20}\b\d{1,3}\s*=\s*\d{1,3}/gi,
    /;\s*(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE|EXEC)\b/gi,
    /\bUNION\b.{0,50}\bSELECT\b/gi,
    /\/\*!\d{5}.*?\*\//g,
    /\/\*.*?\*\//g,
    /\\x[0-9a-fA-F]{2}/g,
  ];

  private readonly prototypeKeys = ["__proto__", "constructor", "prototype"];

  stripXSS(value: string): string {
    let sanitized = value;
    for (const pattern of this.xssPatterns) {
      sanitized = sanitized.replace(pattern, "");
    }
    return sanitized;
  }

  containsSQLi(value: string): boolean {
    for (const pattern of this.sqlPatterns) {
      if (pattern.test(value)) return true;
    }
    return false;
  }

  containsPrototypePollution(value: unknown, path = ""): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === "object") {
      const keys = Object.keys(value as Record<string, unknown>);
      for (const key of keys) {
        if (this.prototypeKeys.includes(key)) return true;
        if (
          this.containsPrototypePollution((value as Record<string, unknown>)[key], `${path}.${key}`)
        )
          return true;
      }
    }
    return false;
  }

  sanitizeObject(obj: Record<string, unknown>, depth = 0): Record<string, unknown> {
    if (depth > 10) return obj;
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (this.prototypeKeys.includes(key)) {
        this.logger.warn(`Prototype pollution attempt detected on key: ${key}`);
        continue;
      }
      if (typeof value === "string") {
        sanitized[key] = this.stripXSS(value);
        if (this.containsSQLi(value)) {
          this.logger.warn(`SQL injection pattern detected in field: ${key}`);
        }
      } else if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeObject(value as Record<string, unknown>, depth + 1);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((item) => {
          if (typeof item === "object" && item !== null) {
            return this.sanitizeObject(item as Record<string, unknown>, depth + 1);
          }
          if (typeof item === "string") {
            const cleaned = this.stripXSS(item);
            if (this.containsSQLi(item)) {
              this.logger.warn(`SQL injection pattern detected in array item`);
            }
            return cleaned;
          }
          return item;
        });
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  use(req: Request, _res: Response, next: NextFunction) {
    try {
      if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
        if (this.containsPrototypePollution(req.body)) {
          this.logger.warn(`Prototype pollution blocked: ${req.method} ${req.originalUrl}`);
          req.body = JSON.parse(JSON.stringify(req.body));
        }
        const sanitized = this.sanitizeObject(req.body);
        req.body = sanitized;
      }

      if (req.query && typeof req.query === "object") {
        const sanitizedQuery = this.sanitizeObject(req.query as Record<string, unknown>);
        req.query = sanitizedQuery as any;
      }

      if (req.params && typeof req.params === "object") {
        for (const key of Object.keys(req.params)) {
          const val = req.params[key];
          if (typeof val === "string") {
            const cleaned = this.stripXSS(val);
            req.params[key] = cleaned;
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `Input sanitization error: ${error instanceof Error ? error.message : error}`
      );
    }

    next();
  }
}
