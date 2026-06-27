import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Request } from "express";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Like {@link AuthGuard}, but never rejects. If a valid, non-expired session
 * token is present it attaches the user to the request (so handlers can
 * personalize the response); otherwise the request proceeds anonymously with no
 * `req.user`.
 *
 * Use on public browse endpoints that are enhanced for signed-in users but must
 * still serve guests (e.g. the reels feed showing per-user "liked" state).
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) return true; // anonymous

    const token = authHeader.split(" ")[1];

    try {
      const session = await this.prisma.session.findUnique({
        where: { token },
        include: { user: true },
      });

      // Mirror AuthGuard's checks (not expired, account not deactivated) but
      // fall through to anonymous instead of throwing on failure.
      if (session && session.expiresAt >= new Date() && session.user.isActive !== false) {
        (request as any).user = session.user;
      }
    } catch {
      // Treat any lookup failure as an anonymous request.
    }

    return true;
  }
}
