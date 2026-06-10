import { logger } from "../logger";
import * as Sentry from "@sentry/react-native";

jest.mock("@sentry/react-native", () => ({
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

describe("logger", () => {
  const originalDev = (global as any).__DEV__;
  const originalConsoleError = console.error;
  const originalConsoleLog = console.log;

  beforeEach(() => {
    console.error = jest.fn();
    console.log = jest.fn();
    jest.clearAllMocks();
  });

  afterAll(() => {
    (global as any).__DEV__ = originalDev;
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });

  describe("development environment", () => {
    beforeEach(() => {
      (global as any).__DEV__ = true;
    });

    it("should log error to console and not call Sentry", () => {
      const error = new Error("test error");
      logger.error("Error message", error);

      expect(console.error).toHaveBeenCalledWith("Error message", error);
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    it("should log info to console and not call Sentry", () => {
      const data = { key: "value" };
      logger.info("Info message", data);

      expect(console.log).toHaveBeenCalledWith("Info message", data);
      expect(Sentry.addBreadcrumb).not.toHaveBeenCalled();
    });
  });

  describe("production environment", () => {
    beforeEach(() => {
      (global as any).__DEV__ = false;
    });

    it("should capture exception to Sentry and not log to console error", () => {
      const error = new Error("test error");
      const context = { userId: "123" };
      logger.error("Error message", error, context);

      expect(console.error).not.toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(error, { extra: context });
    });

    it("should create new error if error is not provided to Sentry captureException", () => {
      const context = { userId: "123" };
      logger.error("Error message", undefined, context);

      expect(console.error).not.toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error), { extra: context });
      expect((Sentry.captureException as jest.Mock).mock.calls[0][0].message).toBe("Error message");
    });

    it("should add breadcrumb to Sentry and not log to console info", () => {
      const data = { key: "value" };
      logger.info("Info message", data);

      expect(console.log).not.toHaveBeenCalled();
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({ message: "Info message", data });
    });
  });
});
