import { NestFactory } from "@nestjs/core";
import { WorkerModule } from "./worker.module";

import { AppLoggerService } from "./infra/logging/app-logger.service";

async function bootstrap() {
  const context = await NestFactory.createApplicationContext(WorkerModule);
  const logger = context.get(AppLoggerService);
  context.useLogger(logger);
  context.enableShutdownHooks();
  logger.log("InHire workers started", "WorkerBootstrap");
}

void bootstrap();
