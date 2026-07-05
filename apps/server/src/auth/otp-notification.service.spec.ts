import { sendOtpViaSms, sendOtpViaEmail, sendOtpDualChannel } from "./otp-notification.service";
import { mailTransporter } from "./mail-transporter";

jest.mock("./mail-transporter", () => ({
  mailTransporter: {
    sendMail: jest.fn(),
  },
}));

describe("OtpNotificationService", () => {
  const mockSendMail = mailTransporter.sendMail as jest.Mock;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    global.fetch = jest.fn() as any;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("sendOtpViaSms", () => {
    it("should return true when ARKESEL_API_KEY is not set in dev", async () => {
      process.env.NODE_ENV = "development";
      delete process.env.ARKESEL_API_KEY;
      const result = await sendOtpViaSms("+233501234567", "123456");
      expect(result).toBe(true);
    });

    it("should call Arkesel API and return true on success", async () => {
      process.env.ARKESEL_API_KEY = "test-key";
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ status: "success" }),
      });

      const result = await sendOtpViaSms("+233501234567", "123456");
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://sms.arkesel.com/api/v2/sms/send",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({ "api-key": "test-key" }),
        })
      );
    });

    it("should return false on Arkesel API failure", async () => {
      process.env.ARKESEL_API_KEY = "test-key";
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ status: "error", message: "Insufficient balance" }),
      });

      const result = await sendOtpViaSms("+233501234567", "123456");
      expect(result).toBe(false);
    });
  });

  describe("sendOtpViaEmail", () => {
    it("should send email and return true on success", async () => {
      mockSendMail.mockResolvedValue({ messageId: "msg-123" });
      const result = await sendOtpViaEmail("user@example.com", "123456", "Jerry", "+233501234567");
      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
          subject: "Your BexieMart verification code",
        })
      );
      // The template renders each digit in its own segmented <td> cell, so
      // assert on the visible text (tags stripped) rather than raw markup.
      const { html } = mockSendMail.mock.calls[0][0];
      const visibleText = html.replace(/<[^>]*>/g, "").replace(/\s+/g, "");
      expect(visibleText).toContain("123456");
    });

    it("should return false on email send error", async () => {
      mockSendMail.mockRejectedValue(new Error("SMTP connection error"));
      const result = await sendOtpViaEmail("user@example.com", "123456");
      expect(result).toBe(false);
    });
  });

  describe("sendOtpDualChannel", () => {
    it("should return success for both when both SMS and Email succeed", async () => {
      process.env.ARKESEL_API_KEY = "test-key";
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ status: "success" }),
      });
      mockSendMail.mockResolvedValue({ messageId: "msg-123" });

      const result = await sendOtpDualChannel({
        phoneNumber: "+233501234567",
        code: "123456",
        email: "user@example.com",
        userName: "Jerry",
      });

      expect(result.smsSuccess).toBe(true);
      expect(result.emailSuccess).toBe(true);
    });

    it("should return emailSuccess=false when email is not provided", async () => {
      process.env.ARKESEL_API_KEY = "test-key";
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ status: "success" }),
      });

      const result = await sendOtpDualChannel({
        phoneNumber: "+233501234567",
        code: "123456",
      });

      expect(result.smsSuccess).toBe(true);
      expect(result.emailSuccess).toBe(false);
      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });
});
