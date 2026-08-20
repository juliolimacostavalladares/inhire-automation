import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { InhireModule } from '../../providers/inhire/inhire.module';
import { DISCOVERY_QUEUE, COLLECTION_QUEUE } from '../../providers/queues/queue.constants';
import { DiscoveryProcessor } from './discovery.processor';
import { DiscoverySourceService } from './discovery-source.service';
import { DiscoverTenantsUseCase } from '../../../app/useCases/crawler/discover-tenants.usecase';

@Module({
  imports: [
    HttpModule,
    InhireModule,
    BullModule.registerQueue(
      { name: DISCOVERY_QUEUE },
      { name: COLLECTION_QUEUE },
    ),
  ],
  providers: [DiscoverTenantsUseCase, DiscoverySourceService, DiscoveryProcessor],
  exports: [DiscoverTenantsUseCase],
})
export class DiscoveryModule {}
