jest.mock("better-auth/node", () => ({
  toNodeHandler: jest.fn(() => jest.fn()),
}));

import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthGuard } from "../guards/auth.guard";
import { AUTH } from "./auth.constants";
import { PrismaService } from "../prisma/prisma.service";

describe("AuthController", () => {
  let controller: AuthController;
  let prisma: any;
  let auth: any;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    vendorProfile: {
      create: jest.fn(),
    },
    session: {
      findUnique: jest.fn(),
    },
  };

  const mockAuth = {
    api: {
      signUpEmail: jest.fn(),
      signInEmail: jest.fn(),
      sendVerificationEmail: jest.fn(),
      forgetPassword: jest.fn(),
      resetPassword: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AUTH, useValue: mockAuth },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    prisma = module.get(PrismaService);
    auth = module.get(AUTH);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("register", () => {
    it("should register a customer successfully", async () => {
      const signUpRes = {
        ok: true,
        headers: new Map(),
        json: jest.fn().mockResolvedValue({
          user: { id: "user-1", email: "test@test.com" },
          token: "token-123",
        }),
      };
      mockAuth.api.signUpEmail.mockResolvedValue(signUpRes);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@test.com",
      });

      const body = { email: "test@test.com", password: "Pass123!", name: "Test" };
      const result = await controller.register(body);

      expect(result.token).toBe("token-123");
      expect(result.message).toBe("Registration successful");
    });

    it("should throw on registration failure", async () => {
      const signUpRes = {
        ok: false,
        json: jest.fn().mockResolvedValue({ message: "Email exists" }),
      };
      mockAuth.api.signUpEmail.mockResolvedValue(signUpRes);

      const body = { email: "exists@test.com", password: "Pass123!", name: "Test" };
      await expect(controller.register(body)).rejects.toThrow("Email exists");
    });

    it("should create vendor profile when role is vendor", async () => {
      const signUpRes = {
        ok: true,
        headers: new Map(),
        json: jest.fn().mockResolvedValue({
          user: { id: "user-2", email: "vendor@test.com" },
          token: "token-456",
        }),
      };
      mockAuth.api.signUpEmail.mockResolvedValue(signUpRes);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-2",
        email: "vendor@test.com",
      });
      mockPrisma.user.update.mockResolvedValue({
        id: "user-2",
        email: "vendor@test.com",
        role: "VENDOR",
      });
      mockPrisma.vendorProfile.create.mockResolvedValue({
        id: "vp-1",
        userId: "user-2",
        shopName: "Test's Shop",
      });

      const body = {
        email: "vendor@test.com",
        password: "Pass123!",
        name: "Test",
        role: "vendor",
      } as any;
      const result = await controller.register(body);

      expect((result as any).user.role).toBe("VENDOR");
      expect(mockPrisma.vendorProfile.create).toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("should login successfully", async () => {
      const signInRes = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          user: { id: "user-1" },
          token: "token-789",
        }),
      };
      mockAuth.api.signInEmail.mockResolvedValue(signInRes);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@test.com",
      });

      const body = { email: "test@test.com", password: "Pass123!" };
      const result = await controller.login(body);

      expect(result.token).toBe("token-789");
      expect(result.user.email).toBe("test@test.com");
    });

    it("should throw on invalid credentials", async () => {
      const signInRes = {
        ok: false,
        json: jest.fn().mockResolvedValue({ message: "Invalid credentials" }),
      };
      mockAuth.api.signInEmail.mockResolvedValue(signInRes);

      const body = { email: "bad@test.com", password: "wrong" };
      await expect(controller.login(body)).rejects.toThrow("Invalid credentials");
    });
  });

  describe("getCurrentUser", () => {
    it("should return current user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@test.com",
        vendorProfile: null,
      });

      const req = { user: { id: "user-1" } };
      const result = await controller.getCurrentUser(req);

      expect(result.user.email).toBe("test@test.com");
    });

    it("should throw when no user in request", async () => {
      const req = {};
      await expect(controller.getCurrentUser(req)).rejects.toThrow("User not found");
    });
  });

  describe("resendVerification", () => {
    it("should resend verification email and return a non-revealing message", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: "user-1", email: "test@test.com" });
      mockAuth.api.sendVerificationEmail.mockResolvedValue(undefined);

      const result = await controller.resendVerification({ email: "test@test.com" });
      expect(result.message).toBe("If an account exists, a verification email has been sent.");
      expect(mockAuth.api.sendVerificationEmail).toHaveBeenCalled();
    });

    it("should not reveal when no account exists (prevents user enumeration)", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await controller.resendVerification({ email: "missing@test.com" });
      expect(result.message).toBe("If an account exists, a verification email has been sent.");
      expect(mockAuth.api.sendVerificationEmail).not.toHaveBeenCalled();
    });
  });

  describe("forgotPassword", () => {
    it("should send reset link", async () => {
      mockAuth.api.forgetPassword.mockResolvedValue(undefined);
      const result = await controller.forgotPassword({ email: "test@test.com" });
      expect(result.message).toBe("If an account exists, a reset link has been sent.");
    });
  });

  describe("resetPassword", () => {
    it("should reset password", async () => {
      mockAuth.api.resetPassword.mockResolvedValue(undefined);
      const result = await controller.resetPassword({ newPassword: "NewPass1!", token: "tok-123" });
      expect(result.message).toBe("Password reset successfully.");
    });
  });
});
