import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { RunStatus, RunTrigger, RunType } from '@prisma/client';
import { Job as BullJob, Queue } from 'bullmq';
import { PrismaService } from '../../databases/prisma/prisma.service';
import {
  COLLECTION_JOB,
  COLLECTION_QUEUE,
  DISCOVERY_JOB,
  DISCOVERY_QUEUE,
} from '../../providers/queues/queue.constants';
import { DiscoverTenantsUseCase } from '../../../app/useCases/crawler/discover-tenants.usecase';

@Injectable()
@Processor(DISCOVERY_QUEUE, { concurrency: 1 })
export class DiscoveryProcessor extends WorkerHost {
  private readonly logger = new Logger(DiscoveryProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly discoverTenantsUseCase: DiscoverTenantsUseCase,
    @InjectQueue(COLLECTION_QUEUE) private readonly collectionQueue: Queue,
  ) {
    super();
  }

  async process(job: BullJob<{ runId: string }>): Promise<void> {
    if (job.name !== DISCOVERY_JOB) return;
    const { runId } = job.data;
    await this.prisma.crawlRun.update({
      where: { id: runId },
      data: { status: RunStatus.RUNNING, startedAt: new Date(), error: null },
    });
    await this.prisma.crawlRunItem.deleteMany({ where: { runId } });

    try {
      const evidence = await this.discoverTenantsUseCase.collectEvidence();
      const grouped = new Map<string, typeof evidence>();
      for (const item of evidence) {
        grouped.set(item.slug, [...(grouped.get(item.slug) ?? []), item]);
      }
      const candidates = [...grouped.entries()];
      await this.prisma.crawlRun.update({
        where: { id: runId },
        data: { totalItems: candidates.length },
      });

      const validation = await this.discoverTenantsUseCase.validateAndSaveCandidates(
        runId,
        candidates,
        async (processed, success, failed, discovered) => {
          await this.prisma.crawlRun.update({
            where: { id: runId },
            data: {
              processedItems: processed,
              successItems: success,
              failedItems: failed,
              discovered,
            },
          });
        },
      );

      const status =
        validation.failed === 0
          ? RunStatus.SUCCEEDED
          : validation.success
            ? RunStatus.PARTIAL
            : RunStatus.FAILED;

      await this.prisma.crawlRun.update({
        where: { id: runId },
        data: { status, finishedAt: new Date() },
      });

      if (validation.discoveredTenantIds.length) {
        await this.enqueueInitialCollection(validation.discoveredTenantIds);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message.slice(0, 1000)
          : 'Discovery failed';
      await this.prisma.crawlRun.update({
        where: { id: runId },
        data: {
          status: RunStatus.FAILED,
          error: message,
          finishedAt: new Date(),
        },
      });
      throw error;
    }
  }

  private async enqueueInitialCollection(tenantIds: string[]) {
    const run = await this.prisma.crawlRun.create({
      data: { type: RunType.COLLECTION, trigger: RunTrigger.DISCOVERY },
    });
    await this.collectionQueue.add(
      COLLECTION_JOB,
      { runId: run.id, tenantIds },
      { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
    );
  }
}
