import { HttpModule } from "@nestjs/axios";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { InhireModule } from "../inhire/inhire.module";
import { COLLECTION_QUEUE, DISCOVERY_QUEUE } from "../queues/queue.constants";
import { DiscoveryProcessor } from "./discovery.processor";
import { DiscoverySourceService } from "./discovery-source.service";

@Module({
  imports: [
    HttpModule,
    InhireModule,
    BullModule.registerQueue(
      { name: DISCOVERY_QUEUE },
      { name: COLLECTION_QUEUE },
    ),
  ],
  providers: [DiscoverySourceService, DiscoveryProcessor],
})
export class DiscoveryModule {}
