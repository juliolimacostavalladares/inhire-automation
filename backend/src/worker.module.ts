import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CollectionModule } from "./collection/collection.module";
import { loadEnvironment } from "./config/environment";
import { DiscoveryModule } from "./discovery/discovery.module";
import { PrismaModule } from "./prisma/prisma.module";
import { QueuesModule } from "./queues/queues.module";

@Module({
  imports: [
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
