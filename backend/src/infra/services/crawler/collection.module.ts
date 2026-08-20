import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { InhireModule } from '../../providers/inhire/inhire.module';
import { COLLECTION_QUEUE } from '../../providers/queues/queue.constants';
import { CollectionProcessor } from './collection.processor';
import { SyncTenantJobsUseCase } from '../../../app/useCases/crawler/sync-tenant-jobs.usecase';

@Module({
  imports: [InhireModule, BullModule.registerQueue({ name: COLLECTION_QUEUE })],
  providers: [SyncTenantJobsUseCase, CollectionProcessor],
  exports: [SyncTenantJobsUseCase],
})
export class CollectionModule {}
