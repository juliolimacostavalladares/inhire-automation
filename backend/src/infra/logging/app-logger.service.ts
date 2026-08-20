import { ConsoleLogger, Injectable, Scope } from "@nestjs/common";

export type LogLevel = "log" | "error" | "warn" | "debug" | "verbose";
export type LogMeta = Record<string, unknown>;

@Injectable({ scope: Scope.DEFAULT })
export class AppLoggerService extends ConsoleLogger {
  private readonly isProduction = process.env.NODE_ENV === "production";

  private formatStructured(
    level: LogLevel,
    message: unknown,
    context?: string,
    meta?: LogMeta,
  ): string {
    const timestamp = new Date().toISOString();
    const formattedMessage =
      typeof message === "string"
        ? message
        : typeof message === "number" ||
            typeof message === "boolean" ||
            typeof message === "bigint"
          ? String(message)
          : message === null
            ? "null"
            : message === undefined
              ? "undefined"
              : JSON.stringify(message);

    if (this.isProduction) {
      return JSON.stringify({
        timestamp,
        level,
        context: context || this.context || "Application",
        message: formattedMessage,
        ...meta,
      });
    }

    const metaStr =
      meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] [${context || this.context || "Application"}] ${formattedMessage}${metaStr}`;
  }

  log(message: unknown, context?: string, meta?: LogMeta): void {
    if (this.isProduction) {
      process.stdout.write(
        this.formatStructured("log", message, context, meta) + "\n",
      );
    } else {
      super.log(
        typeof message === "object" ? JSON.stringify(message) : message,
        context || this.context,
      );
    }
  }

  error(
    message: unknown,
    stack?: string,
    context?: string,
    meta?: LogMeta,
  ): void {
    if (this.isProduction) {
      process.stderr.write(
        this.formatStructured("error", message, context, {
          stack,
          ...meta,
        }) + "\n",
      );
    } else {
      super.error(
        typeof message === "object" ? JSON.stringify(message) : message,
        stack,
        context || this.context,
      );
    }
  }

  warn(message: unknown, context?: string, meta?: LogMeta): void {
    if (this.isProduction) {
      process.stdout.write(
        this.formatStructured("warn", message, context, meta) + "\n",
      );
    } else {
      super.warn(
        typeof message === "object" ? JSON.stringify(message) : message,
        context || this.context,
      );
    }
  }

  debug(message: unknown, context?: string, meta?: LogMeta): void {
    if (this.isProduction) {
      process.stdout.write(
        this.formatStructured("debug", message, context, meta) + "\n",
      );
    } else {
      super.debug(
        typeof message === "object" ? JSON.stringify(message) : message,
        context || this.context,
      );
    }
  }
}
