import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { COLLECTION_QUEUE } from "../queues/queue.constants";
import { HealthController } from "./health.controller";

@Module({
  imports: [BullModule.registerQueue({ name: COLLECTION_QUEUE })],
  controllers: [HealthController],
})
export class HealthModule {}
