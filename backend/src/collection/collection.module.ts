import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { InhireModule } from "../inhire/inhire.module";
import { COLLECTION_QUEUE } from "../queues/queue.constants";
import { CollectionProcessor } from "./collection.processor";

@Module({
  imports: [InhireModule, BullModule.registerQueue({ name: COLLECTION_QUEUE })],
  providers: [CollectionProcessor],
})
export class CollectionModule {}
