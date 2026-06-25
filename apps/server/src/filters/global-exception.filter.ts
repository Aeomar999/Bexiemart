import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  UnprocessableEntityException,
  BadRequestException,
} from "@nestjs/common";
import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import * as Sentry from "@sentry/nestjs";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  private logValidationFailure(request: Request, status: number, message: string, errors: any) {
    const userId = (request as any).user?.id || "anonymous";
    const ip = request.headers["x-forwarded-for"] || request.socket.remoteAddress;
    const correlationId = (request as any).correlationId;

    this.logger.warn(
      `[VALIDATION_FAILURE] User: ${userId} | IP: ${ip} | ${request.method} ${request.url} | ${status} - ${message}`,
      { correlationId, errors, userId }
    );
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let errors: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === "string") {
        message = res;
      } else if (typeof res === "object") {
        const obj = res as any;
        message = obj.message ?? message;
        errors = Array.isArray(obj.message) ? obj.message : undefined;
      }

      if (status === 400 || status === 422) {
        this.logValidationFailure(request, status, message, errors);
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case "P2002":
          status = HttpStatus.CONFLICT;
          message = "A record with this value already exists";
          break;
        case "P2025":
          status = HttpStatus.NOT_FOUND;
          message = "Record not found";
          break;
        case "P2003":
          status = HttpStatus.BAD_REQUEST;
          message = "Referenced record does not exist";
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = "Database error";
          break;
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = "Invalid data provided";
    }
    // Any other error (including a generic Error) stays a 500 with the opaque
    // "Internal server error" message. The real error/stack is logged below;
    // it must never be returned to the client to avoid leaking internals.

    const correlationId = (request as any).correlationId;

    if (status === HttpStatus.NOT_FOUND) {
      if (request.url !== "/favicon.ico" && request.url !== "/") {
        this.logger.warn(`${request.method} ${request.url} 404 - Not Found`);
      }
    } else {
      this.logger.error(
        `${request.method} ${request.url} ${status} - ${message}`,
        exception instanceof Error ? exception.stack : "",
        { correlationId }
      );

      // Report genuinely unexpected server errors (5xx) to Sentry. Client
      // errors (4xx) are expected and are not worth alerting on.
      if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        Sentry.captureException(exception, { tags: { correlationId } });
      }
    }

    const body: Record<string, any> = {
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (correlationId) body.correlationId = correlationId;
    if (errors) body.errors = errors;

    response.status(status).json(body);
  }
}
