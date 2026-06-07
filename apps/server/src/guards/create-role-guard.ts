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

interface ProfileCheck {
  model: string; // Prisma model name (e.g. "vendorProfile")
  findByField: string; // field to find by (e.g. "userId")
  checkActive?: boolean; // whether to check isActive
}

export function createRoleGuard(role: UserRole, profileCheck?: ProfileCheck): Type<CanActivate> {
  @Injectable()
  class RoleGuard implements CanActivate {
    constructor(private prisma: PrismaService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const user = request.user;

      if (!user) throw new UnauthorizedException("Authentication required");
      if (user.role !== role) throw new ForbiddenException("Access required");

      if (profileCheck) {
        // @ts-ignore - Dynamic prisma model access
        const profile = await this.prisma[profileCheck.model].findUnique({
          where: { [profileCheck.findByField]: user.id },
        });

        if (!profile) throw new ForbiddenException("Profile required");
        if (profileCheck.checkActive && !profile.isActive) {
          throw new ForbiddenException("Active profile required");
        }
      }
      return true;
    }
  }
  return mixin(RoleGuard);
}
