import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ApiKeyGuard, Public } from '../guards/api-key.guard';
import { PrismaService } from '../../../infra/databases/prisma/prisma.service';
import {
  COLLECTION_QUEUE,
  DISCOVERY_QUEUE,
} from '../../../infra/providers/queues/queue.constants';

@Controller('health')
@UseGuards(ApiKeyGuard)
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(COLLECTION_QUEUE) private readonly collectionQueue: Queue,
    @InjectQueue(DISCOVERY_QUEUE) private readonly discoveryQueue: Queue,
  ) {}

  @Public()
  @Get()
  async getHealth() {
    let dbStatus = 'ok';
    let collectionQueueStatus = 'ok';
    let discoveryQueueStatus = 'ok';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'unhealthy';
    }

    try {
      await this.collectionQueue.getJobCounts();
    } catch {
      collectionQueueStatus = 'unhealthy';
    }

    try {
      await this.discoveryQueue.getJobCounts();
    } catch {
      discoveryQueueStatus = 'unhealthy';
    }

    const isHealthy =
      dbStatus === 'ok' &&
      collectionQueueStatus === 'ok' &&
      discoveryQueueStatus === 'ok';

    return {
      status: isHealthy ? 'ok' : 'degraded',
      components: {
        database: dbStatus,
        collectionQueue: collectionQueueStatus,
        discoveryQueue: discoveryQueueStatus,
      },
    };
  }
}
