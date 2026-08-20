import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Optional,
  SetMetadata,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { timingSafeEqual } from "node:crypto";
import type { Environment } from "../../../infra/config/environment";
import {
  ALLOW_JWT,
  REQUIRE_ADMIN,
  REQUIRE_USER,
  type AuthenticatedRequest,
  type AuthContext,
} from "./auth-context";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService<Environment, true>,
    private readonly reflector: Reflector,
    @Optional() private readonly jwt?: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();

    const isPublic = Boolean(
      this.reflector.getAllAndOverride<boolean>("public", [
        context.getHandler(),
        context.getClass(),
      ]),
    );

    const requiresUser = Boolean(
      this.reflector.getAllAndOverride<boolean>(REQUIRE_USER, [
        context.getHandler(),
        context.getClass(),
      ]),
    );

    const requiresAdmin = Boolean(
      this.reflector.getAllAndOverride<boolean>(REQUIRE_ADMIN, [
        context.getHandler(),
        context.getClass(),
      ]),
    );

    const allowsJwt =
      isPublic ||
      requiresUser ||
      requiresAdmin ||
      Boolean(
        this.reflector.getAllAndOverride<boolean>(ALLOW_JWT, [
          context.getHandler(),
          context.getClass(),
        ]),
      );

    // 1. Extrair token JWT de Authorization header ou cookie inhire_session
    const cookieToken = request
      .header("cookie")
      ?.match(/(?:^|;\s*)inhire_session=([^;]+)/)?.[1];
    const bearer =
      request.header("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1] ??
      cookieToken;

    let userAuth: AuthContext | null = null;

    if (bearer && this.jwt) {
      try {
        const payload = this.jwt.verify<{
          sub: string;
          email: string;
          role: string;
        }>(bearer, {
          secret: this.config.get("jwtSecret", { infer: true }),
        });

        if (payload?.sub) {
          userAuth = {
            type: "jwt",
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
          };
        }
      } catch {
        // Se a rota for privada e exige JWT, lançar erro de token inválido
        if (!isPublic && (requiresUser || allowsJwt)) {
          throw new UnauthorizedException("Invalid or expired access token");
        }
      }
    }

    // 2. Rotas Públicas: sempre autorizam acesso de visitantes/usuários
    if (isPublic) {
      request.auth = userAuth ?? { type: "anonymous" };
      return true;
    }

    // 3. Usuário autenticado com JWT
    if (userAuth && allowsJwt) {
      if (requiresAdmin && userAuth.role !== "ADMIN") {
        throw new ForbiddenException("Administrator role required");
      }
      request.auth = userAuth;
      return true;
    }

    // 4. Autenticação por API Key (para chamadas diretas de sistema / crawler)
    const suppliedApiKey = request.header("x-api-key") ?? "";
    const expectedApiKey = this.config.get("apiKey", { infer: true });

    if (suppliedApiKey && expectedApiKey) {
      const suppliedBuffer = Buffer.from(suppliedApiKey);
      const expectedBuffer = Buffer.from(expectedApiKey);

      const isValidApiKey =
        suppliedBuffer.length === expectedBuffer.length &&
        timingSafeEqual(suppliedBuffer, expectedBuffer);

      if (isValidApiKey) {
        if (requiresUser) {
          throw new UnauthorizedException("User authentication required");
        }
        request.auth = { type: "apiKey" };
        return true;
      }
    }

    // 5. Nenhuma credencial válida para rota protegida
    request.auth = { type: "anonymous" };
    throw new UnauthorizedException("Authentication required");
  }
}

export const Public = () => SetMetadata("public", true);
export const RequireUser = () => SetMetadata(REQUIRE_USER, true);
export const AllowJwt = () => SetMetadata(ALLOW_JWT, true);
export const RequireAdmin = () => SetMetadata(REQUIRE_ADMIN, true);
