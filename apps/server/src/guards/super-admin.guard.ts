import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";

/**
 * Authorizes only super admins — ADMINs with the `isSuperAdmin` flag.
 *
 * Stacks on top of {@link AuthGuard} (which populates `request.user` with the
 * full DB record) and is used to gate admin-team management (e.g. creating new
 * admin accounts). A regular ADMIN must not be able to mint other admins.
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) throw new UnauthorizedException("Authentication required");
    if (!user.isSuperAdmin) throw new ForbiddenException("Super admin access required");

    return true;
  }
}
