import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  mixin,
  Type,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

interface RoleGuardOptions {
  model?: string; // Prisma model name (e.g. "vendorProfile")
  findByField?: string; // field to find by (e.g. "userId")
  checkActive?: boolean; // whether to check isActive
  requireEmailVerified?: boolean; // whether to check emailVerified
}

export function createRoleGuard(role: UserRole, options?: RoleGuardOptions): Type<CanActivate> {
  @Injectable()
  class RoleGuard implements CanActivate {
    constructor(private prisma: PrismaService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const user = request.user;

      if (!user) throw new UnauthorizedException("Authentication required");
      if (user.role !== role) throw new ForbiddenException("Access required");

      if (options?.requireEmailVerified && !user.emailVerified) {
        throw new ForbiddenException("Email verification required");
      }

      if (options?.model && options?.findByField) {
        // @ts-ignore - Dynamic prisma model access
        const profile = await this.prisma[options.model].findUnique({
          where: { [options.findByField]: user.id },
        });

        if (!profile) throw new ForbiddenException("Profile required");
        if (options.checkActive && !profile.isActive) {
          throw new ForbiddenException("Active profile required");
        }
      }
      return true;
    }
  }
  return mixin(RoleGuard);
}
