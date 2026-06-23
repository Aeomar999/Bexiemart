import { GlobalExceptionFilter } from "./global-exception.filter";
import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

describe("GlobalExceptionFilter", () => {
  let filter: GlobalExceptionFilter;
  let mockRequest: any;
  let mockResponse: any;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();

    mockRequest = {
      url: "/test-url",
      method: "GET",
      headers: { "x-forwarded-for": "127.0.0.1" },
      socket: { remoteAddress: "127.0.0.1" },
      user: { id: "user-1" },
      correlationId: "corr-123",
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockHttpArgumentsHost = {
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn().mockReturnValue(mockResponse),
    };

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue(mockHttpArgumentsHost),
    } as unknown as ArgumentsHost;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(filter).toBeDefined();
  });

  it("should handle standard HttpException", () => {
    const exception = new HttpException("Custom error message", HttpStatus.FORBIDDEN);
    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      statusCode: HttpStatus.FORBIDDEN,
      message: "Custom error message",
      timestamp: expect.any(String),
      path: "/test-url",
      correlationId: "corr-123",
    });
  });

  it("should handle BadRequestException and extract validation errors", () => {
    const errors = ["Field is required"];
    const exception = new BadRequestException(errors);
    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      statusCode: HttpStatus.BAD_REQUEST,
      message: errors,
      errors: errors,
      timestamp: expect.any(String),
      path: "/test-url",
      correlationId: "corr-123",
    });
  });

  it("should handle Prisma.PrismaClientKnownRequestError for unique constraint violation (P2002)", () => {
    const exception = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "5.0.0",
    });

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      statusCode: HttpStatus.CONFLICT,
      message: "A record with this value already exists",
      timestamp: expect.any(String),
      path: "/test-url",
      correlationId: "corr-123",
    });
  });

  it("should handle Prisma.PrismaClientKnownRequestError for record not found (P2025)", () => {
    const exception = new Prisma.PrismaClientKnownRequestError("Record not found", {
      code: "P2025",
      clientVersion: "5.0.0",
    });

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      statusCode: HttpStatus.NOT_FOUND,
      message: "Record not found",
      timestamp: expect.any(String),
      path: "/test-url",
      correlationId: "corr-123",
    });
  });

  it("should handle Prisma.PrismaClientValidationError", () => {
    const exception = new Prisma.PrismaClientValidationError("Invalid field", {
      clientVersion: "5.0.0",
    });

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      statusCode: HttpStatus.BAD_REQUEST,
      message: "Invalid data provided",
      timestamp: expect.any(String),
      path: "/test-url",
      correlationId: "corr-123",
    });
  });

  it("should handle generic Error as Internal Server Error without leaking the message", () => {
    const exception = new Error("Generic unexpected error");

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
      timestamp: expect.any(String),
      path: "/test-url",
      correlationId: "corr-123",
    });
  });
});
