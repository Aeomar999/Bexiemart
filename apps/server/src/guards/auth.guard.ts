import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { auth } from "../auth/better-auth";

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing authorization token");
    }

    const token = authHeader.split(" ")[1];

    const headers = new Headers();
    headers.set("cookie", `better-auth.session_token=${token}`);

    try {
      const session = await auth.api.getSession({ headers });
      if (!session?.user) {
        throw new UnauthorizedException("Invalid session");
      }
      (request as any).user = session.user;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired session");
    }
  }
}

export function CurrentUser(): ParameterDecorator {
  return (_target, _propertyKey, parameterIndex) => {
    // Extracted via custom decorator factory
  };
}
