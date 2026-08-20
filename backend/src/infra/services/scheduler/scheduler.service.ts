import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RunTrigger, RunType } from '../../../domain/enums';
import { CreateRunUseCase } from '../../../app/useCases/runs/create-run.usecase';
import {
  COLLECTION_JOB,
  COLLECTION_QUEUE,
  DISCOVERY_JOB,
  DISCOVERY_QUEUE,
} from '../../providers/queues/queue.constants';
import { PrismaService } from '../../databases/prisma/prisma.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly createRunUseCase: CreateRunUseCase,
    @InjectQueue(COLLECTION_QUEUE) private readonly collectionQueue: Queue,
    @InjectQueue(DISCOVERY_QUEUE) private readonly discoveryQueue: Queue,
  ) {}

  @Cron('0 2 * * *')
  async handleDailyDiscovery() {
    this.logger.log('Starting daily discovery run');
    await this.enqueueRun(RunType.DISCOVERY, RunTrigger.SCHEDULED);
  }

  @Cron('0 */2 * * *')
  async handleBiHourlyCollection() {
    this.logger.log('Starting collection run');
    await this.enqueueRun(RunType.COLLECTION, RunTrigger.SCHEDULED);
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
