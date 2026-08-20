import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import {
  COLLECTION_QUEUE,
  DISCOVERY_QUEUE,
} from '../../providers/queues/queue.constants';
import { SchedulerService } from './scheduler.service';
import { CreateRunUseCase } from '../../../app/useCases/runs/create-run.usecase';
import { CRAWL_RUNS_REPOSITORY_TOKEN } from '../../../app/repositories/crawl-runs.repository.interface';
import { PrismaCrawlRunsRepository } from '../../repositories/prisma-crawl-runs.repository';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue(
      { name: COLLECTION_QUEUE },
      { name: DISCOVERY_QUEUE },
    ),
  ],
  providers: [
    {
      provide: CRAWL_RUNS_REPOSITORY_TOKEN,
      useClass: PrismaCrawlRunsRepository,
    },
    CreateRunUseCase,
    SchedulerService,
  ],
})
export class SchedulerModule {}
