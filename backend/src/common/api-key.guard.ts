import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import type { Environment } from "../config/environment";
import { ALLOW_JWT, REQUIRE_ADMIN, REQUIRE_USER, type AuthenticatedRequest } from "./auth-context";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService<Environment, true>,
    private readonly reflector: Reflector,
    private readonly jwt?: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();
    const isPublic = this.reflector.getAllAndOverride<boolean>("public", [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiresUser = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_USER,
      [context.getHandler(), context.getClass()],
    );
    const allowsJwt = requiresUser || this.reflector.getAllAndOverride<boolean>(ALLOW_JWT, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiresAdmin = this.reflector.getAllAndOverride<boolean>(REQUIRE_ADMIN, [
      context.getHandler(),
      context.getClass(),
    ]);

    const cookieToken = request
      .header("cookie")
      ?.match(/(?:^|;\s*)inhire_session=([^;]+)/)?.[1];
    const bearer = request.header("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1] ?? cookieToken;
    if (bearer && this.jwt) {
      let payload: { sub: string; email: string; role: string } | undefined;
      try {
        payload = this.jwt.verify<{ sub: string; email: string; role: string }>(
          bearer,
          { secret: this.config.get("jwtSecret", { infer: true }) },
        );
      } catch {
        if (!isPublic) throw new UnauthorizedException("Invalid access token");
      }
      if (payload) {
        if (!allowsJwt) throw new UnauthorizedException("API key authentication required");
        if (requiresAdmin && payload.role !== "ADMIN") {
          throw new ForbiddenException("Administrator role required");
        }
        request.auth = { type: "jwt", userId: payload.sub, email: payload.email, role: payload.role };
        return true;
      }
    }

    const supplied = request.header("x-api-key") ?? "";
    const expected = this.config.get("apiKey", { infer: true });
    const suppliedBuffer = Buffer.from(supplied);
    const expectedBuffer = Buffer.from(expected);
    const valid =
      suppliedBuffer.length === expectedBuffer.length &&
      timingSafeEqual(suppliedBuffer, expectedBuffer);
    if (valid) {
      request.auth = { type: "apiKey" };
      if (requiresUser) throw new UnauthorizedException("User authentication required");
      return true;
    }

    request.auth = { type: "anonymous" };
    if (isPublic && !requiresUser) return true;
    throw new UnauthorizedException("Authentication required");
  }
}

export const Public = () => SetMetadata("public", true);
export const RequireUser = () => SetMetadata(REQUIRE_USER, true);
export const AllowJwt = () => SetMetadata(ALLOW_JWT, true);
export const RequireAdmin = () => SetMetadata(REQUIRE_ADMIN, true);
