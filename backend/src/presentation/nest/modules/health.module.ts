import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { HealthController } from '../../http/controllers/health.controller';
import {
  COLLECTION_QUEUE,
  DISCOVERY_QUEUE,
} from '../../../infra/providers/queues/queue.constants';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: COLLECTION_QUEUE },
      { name: DISCOVERY_QUEUE },
    ),
  ],
  controllers: [HealthController],
})
export class HealthModule {}
