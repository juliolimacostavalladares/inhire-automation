import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";
import type { Environment } from "./config/environment";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService<Environment, true>);
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  const origins = config.get("corsOrigins", { infer: true });
  app.enableCors({
    origin: origins.length ? origins : ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept", "Authorization", "X-API-Key", "Origin", "DNT", "X-CustomHeader", "Keep-Alive", "User-Agent", "X-Requested-With", "If-Modified-Since", "Cache-Control"],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle("InHire Jobs API")
    .setDescription(
      "API de descoberta, coleta e consulta de vagas publicadas na InHire",
    )
    .setVersion("1.0")
    .addApiKey({ type: "apiKey", in: "header", name: "X-API-Key" }, "api-key")
    .addSecurityRequirements("api-key")
    .build();
  SwaggerModule.setup(
    "docs",
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  app.enableShutdownHooks();
  const port = config.get("port", { infer: true });
  await app.listen(port, "0.0.0.0");
  Logger.log(`InHire API listening on port ${port}`, "Bootstrap");
}

void bootstrap();
