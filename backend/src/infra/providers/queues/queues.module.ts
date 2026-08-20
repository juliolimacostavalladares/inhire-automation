import { BullModule } from "@nestjs/bullmq";
import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import type { Environment } from "../../config/environment";

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>) => ({
        connection: {
          host: config.get("redisHost", { infer: true }),
          port: config.get("redisPort", { infer: true }),
          password: config.get("redisPassword", { infer: true }),
          maxRetriesPerRequest: null,
        },
        defaultJobOptions: { removeOnComplete: 500, removeOnFail: 1_000 },
      }),
    }),
  ],
  exports: [BullModule],
})
export class QueuesModule {}
