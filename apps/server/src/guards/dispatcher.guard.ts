import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DispatcherGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (user.role !== UserRole.DISPATCHER) {
      throw new ForbiddenException('Dispatcher access required');
    }

    // Verify they actually have a dispatcher profile
    const profile = await this.prisma.dispatcherProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      throw new ForbiddenException('Dispatcher profile required');
    }

    return true;
  }
}
