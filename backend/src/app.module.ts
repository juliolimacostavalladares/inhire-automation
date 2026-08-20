import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ApiKeyGuard } from './presentation/http/guards/api-key.guard';
import { type Environment, loadEnvironment } from './infra/config/environment';
import { PrismaModule } from './infra/databases/prisma/prisma.module';
import { LoggingModule } from './infra/logging/logging.module';
import { HttpLoggingInterceptor } from './presentation/http/interceptors/http-logging.interceptor';
import { AllExceptionsFilter } from './presentation/http/filters/all-exceptions.filter';
import { AiModule } from './infra/providers/ai/ai.module';
import { InhireModule } from './infra/providers/inhire/inhire.module';
import { QueuesModule } from './infra/providers/queues/queues.module';
import { SchedulerModule } from './infra/services/scheduler/scheduler.module';
import { AuthModule } from './presentation/nest/modules/auth.module';
import { ProfileModule } from './presentation/nest/modules/profile.module';
import { JobsModule } from './presentation/nest/modules/jobs.module';
import { TenantsModule } from './presentation/nest/modules/tenants.module';
import { RunsModule } from './presentation/nest/modules/runs.module';
import { HealthModule } from './presentation/nest/modules/health.module';
import { AiPresentationModule } from './presentation/nest/modules/ai.presentation.module';

@Module({
  imports: [
    LoggingModule,
    AiModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [loadEnvironment],
      cache: true,
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>) => ({
        secret: config.get('jwtSecret', { infer: true }),
        signOptions: { expiresIn: config.get('jwtExpiresIn', { infer: true }) },
      }),
    }),
    InhireModule,
    PrismaModule,
    QueuesModule,
    HealthModule,
    AiPresentationModule,
    AuthModule,
    ProfileModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    TenantsModule,
    JobsModule,
    RunsModule,
    SchedulerModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: HttpLoggingInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: ApiKeyGuard },
  ],
})
export class AppModule {}
