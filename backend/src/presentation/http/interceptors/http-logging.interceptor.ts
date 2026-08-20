import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { Observable, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import type { AuthenticatedRequest } from "../guards/auth-context";
import { AppLoggerService } from "../../../infra/logging/app-logger.service";

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {
    this.logger.setContext("HTTP");
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest<AuthenticatedRequest>();
    const res = httpContext.getResponse<Response>();

    const requestId =
      (req.headers["x-request-id"] as string) ||
      (req.headers["x-correlation-id"] as string) ||
      randomUUID();
    req.headers["x-request-id"] = requestId;
    res.setHeader("X-Request-ID", requestId);

    const startTime = Date.now();
    const { method, originalUrl, ip } = req;
    const userAgent = req.get("user-agent") || "unknown";

    const sanitizeHeaders = (headers: Request["headers"]) => {
      const sanitized = { ...headers };
      delete sanitized.authorization;
      delete sanitized.cookie;
      delete sanitized["x-api-key"];
      return sanitized;
    };

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - startTime;
        const statusCode = res.statusCode;
        const auth = req.auth;

        this.logger.log(`${method} ${originalUrl} ${statusCode} +${durationMs}ms`, "HTTP", {
          requestId,
          method,
          url: originalUrl,
          statusCode,
          durationMs,
          ip,
          userAgent,
          authType: auth?.type || "anonymous",
          userId: auth?.type === "jwt" ? auth.userId : undefined,
        });
      }),
      catchError((error: unknown) => {
        const durationMs = Date.now() - startTime;
        const statusCode =
          error instanceof HttpException
            ? error.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;
        const auth = req.auth;
        const errorMessage =
          error instanceof Error ? error.message : "Unhandled Exception";
        const stack = error instanceof Error ? error.stack : undefined;

        this.logger.error(
          `${method} ${originalUrl} ${statusCode} +${durationMs}ms - ${errorMessage}`,
          stack,
          "HTTP",
          {
            requestId,
            method,
            url: originalUrl,
            statusCode,
            durationMs,
            ip,
            userAgent,
            authType: auth?.type || "anonymous",
            userId: auth?.type === "jwt" ? auth.userId : undefined,
            error: errorMessage,
            headers: sanitizeHeaders(req.headers),
          },
        );

        return throwError(() => error);
      }),
    );
  }
}
