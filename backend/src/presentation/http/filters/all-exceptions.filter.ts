import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Response } from "express";
import type { AuthenticatedRequest } from "../guards/auth-context";
import { AppLoggerService } from "../../../infra/logging/app-logger.service";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLoggerService) {
    this.logger.setContext("ExceptionFilter");
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<AuthenticatedRequest>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const message =
      typeof exceptionResponse === "object" && exceptionResponse !== null
        ? (exceptionResponse as { message?: string | string[] }).message ||
          String(exception)
        : exception instanceof Error
          ? exception.message
          : "Internal server error";

    const requestId =
      (request.headers?.["x-request-id"] as string) || "unknown";
    const auth = request.auth;

    const errorPayload = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId,
      message,
    };

    if (status >= 500) {
      this.logger.error(
        `Unhandled ${status} error on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : undefined,
        "ExceptionFilter",
        {
          requestId,
          path: request.url,
          method: request.method,
          status,
          message,
          userId: auth?.type === "jwt" ? auth.userId : undefined,
        },
      );
    }

    response.status(status).json(errorPayload);
  }
}
