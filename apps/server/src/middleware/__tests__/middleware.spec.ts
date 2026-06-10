import { Request, Response, NextFunction } from "express";
import { BadRequestException } from "@nestjs/common";

jest.mock("uuid", () => ({ v4: () => "mocked-uuid" }));

import { AuditLoggerMiddleware } from "../audit-logger.middleware";
import { CorrelationIdMiddleware } from "../correlation-id.middleware";
import { InputSanitizerMiddleware } from "../input-sanitizer.middleware";
import { SsrfGuardMiddleware } from "../ssrf-guard.middleware";

describe("Middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
      socket: { remoteAddress: "127.0.0.1" } as any,
    };
    res = {
      setHeader: jest.fn(),
      on: jest.fn((event, callback) => {
        if (event === "finish") {
          // Store the callback to trigger it manually
          (res as any)._finishCallback = callback;
        }
        return res as Response;
      }),
    } as unknown as Partial<Response>;
    next = jest.fn();
  });

  describe("AuditLoggerMiddleware", () => {
    let middleware: AuditLoggerMiddleware;

    beforeEach(() => {
      middleware = new AuditLoggerMiddleware();
    });

    it("should log requests for sensitive routes", () => {
      req.baseUrl = "/wallet/withdraw";
      Object.defineProperty(req, "path", { value: "/wallet/withdraw", writable: true });
      req.method = "POST";
      req.originalUrl = "/api/wallet/withdraw";

      const loggerSpy = jest.spyOn((middleware as any).logger, "log").mockImplementation();

      middleware.use(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.on).toHaveBeenCalledWith("finish", expect.any(Function));

      // Trigger the finish event
      (res as any)._finishCallback();

      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining("[AUDIT]"));
    });

    it("should not log for non-sensitive routes", () => {
      req.baseUrl = "/public/info";
      Object.defineProperty(req, "path", { value: "/public/info", writable: true });

      const loggerSpy = jest.spyOn((middleware as any).logger, "log").mockImplementation();

      middleware.use(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();

      // Trigger finish if it was registered
      if ((res as any)._finishCallback) {
        (res as any)._finishCallback();
      }

      expect(loggerSpy).not.toHaveBeenCalled();
    });
  });

  describe("CorrelationIdMiddleware", () => {
    let middleware: CorrelationIdMiddleware;

    beforeEach(() => {
      middleware = new CorrelationIdMiddleware();
    });

    it("should generate a new correlation id if not provided", () => {
      middleware.use(req as Request, res as Response, next);

      expect((req as any).correlationId).toBeDefined();
      expect(res.setHeader).toHaveBeenCalledWith("x-correlation-id", (req as any).correlationId);
      expect(next).toHaveBeenCalled();
    });

    it("should use provided correlation id", () => {
      const existingId = "existing-id-123";
      req.headers = { "x-correlation-id": existingId };

      middleware.use(req as Request, res as Response, next);

      expect((req as any).correlationId).toBe(existingId);
      expect(res.setHeader).toHaveBeenCalledWith("x-correlation-id", existingId);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("InputSanitizerMiddleware", () => {
    let middleware: InputSanitizerMiddleware;

    beforeEach(() => {
      middleware = new InputSanitizerMiddleware();
      req.body = {};
      req.query = {};
      req.params = {};
    });

    it("should sanitize XSS from body, query and params", () => {
      req.body = { description: '<script>alert("xss")</script>hello' };
      req.query = { q: "javascript:alert(1)" };
      req.params = { id: "<iframe src='bad'></iframe>123" };

      middleware.use(req as Request, res as Response, next);

      expect((req.body as any).description).toBe("hello");
      expect((req.query as any).q).toBe("alert(1)");
      expect((req.params as any).id).toBe("</iframe>123");
      expect(next).toHaveBeenCalled();
    });

    it("should detect prototype pollution and clean it", () => {
      const loggerSpy = jest.spyOn((middleware as any).logger, "warn").mockImplementation();

      req.body = JSON.parse('{"__proto__": {"admin": true}, "name": "test"}');

      middleware.use(req as Request, res as Response, next);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining("Prototype pollution blocked")
      );
      expect((req.body as any).__proto__.admin).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it("should leave safe input unchanged", () => {
      const safeBody = { name: "John Doe", age: 30 };
      req.body = { ...safeBody };

      middleware.use(req as Request, res as Response, next);

      expect(req.body).toEqual(safeBody);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("SsrfGuardMiddleware", () => {
    let middleware: SsrfGuardMiddleware;

    beforeEach(() => {
      middleware = new SsrfGuardMiddleware();
      req.method = "POST";
      req.originalUrl = "/api/webhook";
    });

    it("should allow valid external URLs", () => {
      req.body = { url: "https://google.com" };
      middleware.use(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it("should block localhost URLs", () => {
      req.body = { url: "http://localhost:8080/admin" };

      expect(() => middleware.use(req as Request, res as Response, next)).toThrow(
        BadRequestException
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should block IP ranges in nested objects", () => {
      req.body = { data: { config: { webhook: "http://127.0.0.1/internal" } } };

      expect(() => middleware.use(req as Request, res as Response, next)).toThrow(
        BadRequestException
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should block URLs in arrays", () => {
      req.body = {
        endpoints: ["https://api.stripe.com", "http://169.254.169.254/latest/meta-data"],
      };

      expect(() => middleware.use(req as Request, res as Response, next)).toThrow(
        BadRequestException
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should handle non-URL strings safely", () => {
      req.body = { message: "Check out 127.0.0.1" }; // Not a valid URL
      middleware.use(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
