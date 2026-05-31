import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VendorGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (user.role !== UserRole.VENDOR) {
      throw new ForbiddenException('Vendor access required');
    }

    // Verify they actually have an active vendor profile
    const profile = await this.prisma.vendorProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile || !profile.isActive) {
      throw new ForbiddenException('Active vendor profile required');
    }

    return true;
  }
}
