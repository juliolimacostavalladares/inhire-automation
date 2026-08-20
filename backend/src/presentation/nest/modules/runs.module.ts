import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import {
  COLLECTION_QUEUE,
  DISCOVERY_QUEUE,
} from '../../../infra/providers/queues/queue.constants';
import { RunsController } from '../../http/controllers/runs.controller';
import { ListRunsUseCase } from '../../../app/useCases/runs/list-runs.usecase';
import { GetRunUseCase } from '../../../app/useCases/runs/get-run.usecase';
import { CreateRunUseCase } from '../../../app/useCases/runs/create-run.usecase';
import { CRAWL_RUNS_REPOSITORY_TOKEN } from '../../../app/repositories/crawl-runs.repository.interface';
import { PrismaCrawlRunsRepository } from '../../../infra/repositories/prisma-crawl-runs.repository';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: COLLECTION_QUEUE },
      { name: DISCOVERY_QUEUE },
    ),
  ],
  controllers: [RunsController],
  providers: [
    {
      provide: CRAWL_RUNS_REPOSITORY_TOKEN,
      useClass: PrismaCrawlRunsRepository,
    },
    ListRunsUseCase,
    GetRunUseCase,
    CreateRunUseCase,
  ],
  exports: [
    CRAWL_RUNS_REPOSITORY_TOKEN,
    ListRunsUseCase,
    GetRunUseCase,
    CreateRunUseCase,
    BullModule,
  ],
})
export class RunsModule {}
