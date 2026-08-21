import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { type Environment, loadEnvironment } from './infra/config/environment';
import { PrismaModule } from './infra/databases/prisma/prisma.module';
import { LoggingModule } from './infra/logging/logging.module';
import { AiModule } from './infra/providers/ai/ai.module';
import { QueuesModule } from './infra/providers/queues/queues.module';
import { CollectionModule } from './infra/services/crawler/collection.module';
import { DiscoveryModule } from './infra/services/crawler/discovery.module';
import { JobsModule } from './presentation/nest/modules/jobs.module';

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
    PrismaModule,
    QueuesModule,
    CollectionModule,
    DiscoveryModule,
    JobsModule,
  ],
})
export class WorkerModule {}
