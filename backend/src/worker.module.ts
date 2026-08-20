import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { loadEnvironment } from './infra/config/environment';
import { PrismaModule } from './infra/databases/prisma/prisma.module';
import { LoggingModule } from './infra/logging/logging.module';
import { AiModule } from './infra/providers/ai/ai.module';
import { QueuesModule } from './infra/providers/queues/queues.module';
import { CollectionModule } from './infra/services/crawler/collection.module';
import { DiscoveryModule } from './infra/services/crawler/discovery.module';

@Module({
  imports: [
    LoggingModule,
    AiModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [loadEnvironment],
      cache: true,
    }),
    PrismaModule,
    QueuesModule,
    CollectionModule,
    DiscoveryModule,
  ],
})
export class WorkerModule {}
