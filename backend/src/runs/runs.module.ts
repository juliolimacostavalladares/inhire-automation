import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { COLLECTION_QUEUE, DISCOVERY_QUEUE } from "../queues/queue.constants";
import { RunsController } from "./runs.controller";
import { RunsService } from "./runs.service";

@Module({
  imports: [
    BullModule.registerQueue(
      { name: COLLECTION_QUEUE },
      { name: DISCOVERY_QUEUE },
    ),
  ],
  controllers: [RunsController],
  providers: [RunsService],
  exports: [RunsService],
})
export class RunsModule {}
