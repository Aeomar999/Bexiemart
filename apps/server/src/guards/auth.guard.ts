import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing authorization token");
    }

    const token = authHeader.split(" ")[1];

    try {
      const session = await this.prisma.session.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!session || session.expiresAt < new Date()) {
        throw new UnauthorizedException("Invalid or expired session");
      }

      // Account-level kill switch: a banned/deactivated user must not pass auth,
      // even with an otherwise valid session token.
      if (session.user.isActive === false) {
        throw new UnauthorizedException("Account has been deactivated");
      }

      (request as any).user = session.user;
      return true;
    } catch (err) {
      throw new UnauthorizedException("Invalid or expired session");
    }
  }
}

export function CurrentUser(): ParameterDecorator {
  return (_target, _propertyKey, parameterIndex) => {
    // Extracted via custom decorator factory
  };
}
