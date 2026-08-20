import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RunTrigger, RunType } from '@prisma/client';
import { ApiKeyGuard, Public } from '../guards/api-key.guard';
import { QueryRunsDto } from '../dto/query-runs.dto';
import { ListRunsUseCase } from '../../../app/useCases/runs/list-runs.usecase';
import { GetRunUseCase } from '../../../app/useCases/runs/get-run.usecase';
import { CreateRunUseCase } from '../../../app/useCases/runs/create-run.usecase';
import {
  COLLECTION_JOB,
  COLLECTION_QUEUE,
  DISCOVERY_JOB,
  DISCOVERY_QUEUE,
} from '../../../infra/providers/queues/queue.constants';
import { PrismaService } from '../../../infra/databases/prisma/prisma.service';

@Controller('runs')
@UseGuards(ApiKeyGuard)
export class RunsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly listRunsUseCase: ListRunsUseCase,
    private readonly getRunUseCase: GetRunUseCase,
    private readonly createRunUseCase: CreateRunUseCase,
    @InjectQueue(COLLECTION_QUEUE) private readonly collectionQueue: Queue,
    @InjectQueue(DISCOVERY_QUEUE) private readonly discoveryQueue: Queue,
  ) {}

  @Post('collection')
  async triggerCollection() {
    return this.enqueueRun(RunType.COLLECTION, RunTrigger.MANUAL);
  }

  @Post('discovery')
  async triggerDiscovery() {
    return this.enqueueRun(RunType.DISCOVERY, RunTrigger.MANUAL);
  }

  @Public()
  @Get()
  async list(@Query() query: QueryRunsDto) {
    return this.listRunsUseCase.execute(query.page, query.limit);
  }

  @Public()
  @Get(':id')
  async get(@Param('id') id: string) {
    return this.getRunUseCase.execute(id);
  }

  private async enqueueRun(type: RunType, trigger: RunTrigger) {
    const pending = await this.prisma.crawlRun.findFirst({
      where: { type, status: { in: ['QUEUED', 'RUNNING'] } },
      orderBy: { createdAt: 'desc' },
    });
    if (pending) return pending;

    const run = await this.createRunUseCase.execute({ type, trigger });
    const queue =
      type === RunType.COLLECTION ? this.collectionQueue : this.discoveryQueue;
    const name = type === RunType.COLLECTION ? COLLECTION_JOB : DISCOVERY_JOB;
    try {
      await queue.add(
        name,
        { runId: run.id },
        { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
      );
      return run;
    } catch (error) {
      await this.prisma.crawlRun.update({
        where: { id: run.id },
        data: {
          status: 'FAILED',
          error: 'Unable to enqueue run',
          finishedAt: new Date(),
        },
      });
      throw error;
    }
  }
}
