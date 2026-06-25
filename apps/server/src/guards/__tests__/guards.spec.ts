import { ExecutionContext, UnauthorizedException, ForbiddenException } from "@nestjs/common";
import { AuthGuard } from "../auth.guard";
import { createRoleGuard } from "../create-role-guard";
import { AdminGuard } from "../admin.guard";
import { DispatcherGuard } from "../dispatcher.guard";
import { VendorGuard } from "../vendor.guard";
import { SuperAdminGuard } from "../super-admin.guard";
import { PrismaService } from "../../prisma/prisma.service";
import { UserRole } from "@prisma/client";

describe("Guards", () => {
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(() => {
    prismaService = {
      session: {
        findUnique: jest.fn(),
      },
      vendorProfile: {
        findUnique: jest.fn(),
      },
      dispatcherProfile: {
        findUnique: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;
  });

  const mockExecutionContext = (headers: any, user?: any) => {
    const request = { headers, user };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  describe("AuthGuard", () => {
    let authGuard: AuthGuard;

    beforeEach(() => {
      authGuard = new AuthGuard(prismaService);
    });

    it("should throw UnauthorizedException if no token is provided", async () => {
      const context = mockExecutionContext({});
      await expect(authGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException if invalid token format", async () => {
      const context = mockExecutionContext({ authorization: "InvalidToken" });
      await expect(authGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException if session not found", async () => {
      const context = mockExecutionContext({ authorization: "Bearer valid_token" });
      (prismaService.session.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(authGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException if session expired", async () => {
      const context = mockExecutionContext({ authorization: "Bearer valid_token" });
      (prismaService.session.findUnique as jest.Mock).mockResolvedValue({
        expiresAt: new Date(Date.now() - 10000), // Expired
      });
      await expect(authGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it("should return true and attach user to request if token is valid", async () => {
      const mockUser = { id: "user_id" };
      const context = mockExecutionContext({ authorization: "Bearer valid_token" });
      (prismaService.session.findUnique as jest.Mock).mockResolvedValue({
        expiresAt: new Date(Date.now() + 10000), // Future
        user: mockUser,
      });

      const result = await authGuard.canActivate(context);
      expect(result).toBe(true);
      expect(context.switchToHttp().getRequest().user).toBe(mockUser);
    });
  });

  describe("RoleGuards (createRoleGuard)", () => {
    describe("Base behavior", () => {
      const TestGuardClass = createRoleGuard(UserRole.CUSTOMER);
      let testGuard: any;

      beforeEach(() => {
        testGuard = new TestGuardClass(prismaService);
      });

      it("should throw UnauthorizedException if no user is present", async () => {
        const context = mockExecutionContext({}, null);
        await expect(testGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      });

      it("should throw ForbiddenException if user has incorrect role", async () => {
        const context = mockExecutionContext({}, { role: UserRole.VENDOR });
        await expect(testGuard.canActivate(context)).rejects.toThrow(ForbiddenException);
      });

      it("should return true if user has correct role and no profile check is required", async () => {
        const context = mockExecutionContext({}, { role: UserRole.CUSTOMER });
        const result = await testGuard.canActivate(context);
        expect(result).toBe(true);
      });
    });

    describe("AdminGuard", () => {
      let adminGuard: any;

      beforeEach(() => {
        adminGuard = new AdminGuard(prismaService);
      });

      it("should return true for admin user", async () => {
        const context = mockExecutionContext({}, { role: UserRole.ADMIN });
        const result = await adminGuard.canActivate(context);
        expect(result).toBe(true);
      });

      it("should throw ForbiddenException for non-admin user", async () => {
        const context = mockExecutionContext({}, { role: UserRole.CUSTOMER });
        await expect(adminGuard.canActivate(context)).rejects.toThrow(ForbiddenException);
      });
    });

    describe("VendorGuard", () => {
      let vendorGuard: any;

      beforeEach(() => {
        vendorGuard = new VendorGuard(prismaService);
      });

      it("should throw ForbiddenException if profile is not found", async () => {
        const context = mockExecutionContext({}, { id: "vendor_1", role: UserRole.VENDOR });
        (prismaService.vendorProfile.findUnique as jest.Mock).mockResolvedValue(null);
        await expect(vendorGuard.canActivate(context)).rejects.toThrow(ForbiddenException);
      });

      it("should throw ForbiddenException if profile is inactive", async () => {
        const context = mockExecutionContext({}, { id: "vendor_1", role: UserRole.VENDOR });
        (prismaService.vendorProfile.findUnique as jest.Mock).mockResolvedValue({
          isActive: false,
        });
        await expect(vendorGuard.canActivate(context)).rejects.toThrow(ForbiddenException);
      });

      it("should return true if active profile is found", async () => {
        const context = mockExecutionContext({}, { id: "vendor_1", role: UserRole.VENDOR });
        (prismaService.vendorProfile.findUnique as jest.Mock).mockResolvedValue({ isActive: true });
        const result = await vendorGuard.canActivate(context);
        expect(result).toBe(true);
      });
    });

    describe("DispatcherGuard", () => {
      let dispatcherGuard: any;

      beforeEach(() => {
        dispatcherGuard = new DispatcherGuard(prismaService);
      });

      it("should return true if active profile is found", async () => {
        const context = mockExecutionContext({}, { id: "disp_1", role: UserRole.DISPATCHER });
        (prismaService.dispatcherProfile.findUnique as jest.Mock).mockResolvedValue({
          isActive: true,
        });
        const result = await dispatcherGuard.canActivate(context);
        expect(result).toBe(true);
      });
    });

    describe("SuperAdminGuard", () => {
      const superAdminGuard = new SuperAdminGuard();

      it("throws UnauthorizedException if no user on request", () => {
        const context = mockExecutionContext({}, undefined);
        expect(() => superAdminGuard.canActivate(context)).toThrow(UnauthorizedException);
      });

      it("throws ForbiddenException for a regular admin (no super flag)", () => {
        const context = mockExecutionContext(
          {},
          { id: "a1", role: UserRole.ADMIN, isSuperAdmin: false }
        );
        expect(() => superAdminGuard.canActivate(context)).toThrow(ForbiddenException);
      });

      it("returns true for a super admin", () => {
        const context = mockExecutionContext(
          {},
          { id: "a1", role: UserRole.ADMIN, isSuperAdmin: true }
        );
        expect(superAdminGuard.canActivate(context)).toBe(true);
      });
    });
  });
});
