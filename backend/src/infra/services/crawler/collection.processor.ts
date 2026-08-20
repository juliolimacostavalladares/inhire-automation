import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job as BullJob } from 'bullmq';
import { RunItemStatus, RunStatus } from '@prisma/client';
import { InhireClientService } from '../../providers/inhire/inhire-client.service';
import { PrismaService } from '../../databases/prisma/prisma.service';
import { COLLECTION_JOB, COLLECTION_QUEUE } from '../../providers/queues/queue.constants';
import { SyncTenantJobsUseCase } from '../../../app/useCases/crawler/sync-tenant-jobs.usecase';

type CollectionData = { runId: string; tenantIds?: string[] };

@Injectable()
@Processor(COLLECTION_QUEUE, { concurrency: 1 })
export class CollectionProcessor extends WorkerHost {
  private readonly logger = new Logger(CollectionProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly inhire: InhireClientService,
    private readonly syncTenantJobsUseCase: SyncTenantJobsUseCase,
  ) {
    super();
  }

  async process(job: BullJob<CollectionData>): Promise<void> {
    if (job.name !== COLLECTION_JOB) return;
    const { runId, tenantIds } = job.data;
    await this.prisma.crawlRun.update({
      where: { id: runId },
      data: { status: RunStatus.RUNNING, startedAt: new Date(), error: null },
    });
    await this.prisma.crawlRunItem.deleteMany({ where: { runId } });

    try {
      const tenants = await this.prisma.tenant.findMany({
        where: {
          active: true,
          ...(tenantIds?.length ? { id: { in: tenantIds } } : {}),
        },
        orderBy: { id: 'asc' },
      });
      await this.prisma.crawlRun.update({
        where: { id: runId },
        data: { totalItems: tenants.length },
      });

      const totals = {
        processed: 0,
        success: 0,
        failed: 0,
        created: 0,
        updated: 0,
        closed: 0,
      };

      await this.pool(tenants, 8, async (tenant) => {
        const item = await this.prisma.crawlRunItem.create({
          data: { runId, tenantId: tenant.id, subject: tenant.slug },
        });
        try {
          const page = await this.inhire.fetchTenant(tenant.slug);
          if (!page) throw new Error('Tenant was not confirmed by InHire');

          const result = await this.syncTenantJobsUseCase.execute(
            tenant.id,
            tenant.slug,
            page.jobsPage,
          );

          totals.success++;
          totals.created += result.created;
          totals.updated += result.updated;
          totals.closed += result.closed;

          await this.prisma.$transaction([
            this.prisma.tenant.update({
              where: { id: tenant.id },
              data: {
                name: page.tenantName || tenant.name,
                ...(page.logo ? { logoUrl: page.logo } : {}),
                lastValidatedAt: new Date(),
                lastCollectedAt: new Date(),
              },
            }),
            this.prisma.crawlRunItem.update({
              where: { id: item.id },
              data: { status: RunItemStatus.SUCCEEDED },
            }),
          ]);
        } catch (error) {
          totals.failed++;
          const message =
            error instanceof Error
              ? error.message.slice(0, 1000)
              : 'Unknown collection error';
          this.logger.warn(
            `Collection failed for tenant ${tenant.slug}: ${message}`,
          );
          await this.prisma.crawlRunItem.update({
            where: { id: item.id },
            data: { status: RunItemStatus.FAILED, error: message },
          });
        } finally {
          totals.processed++;
          await this.prisma.crawlRun.update({
            where: { id: runId },
            data: {
              processedItems: totals.processed,
              successItems: totals.success,
              failedItems: totals.failed,
              jobsCreated: totals.created,
              jobsUpdated: totals.updated,
              jobsClosed: totals.closed,
            },
          });
        }
      });

      const status =
        totals.failed === 0
          ? RunStatus.SUCCEEDED
          : totals.success
            ? RunStatus.PARTIAL
            : RunStatus.FAILED;

      await this.prisma.crawlRun.update({
        where: { id: runId },
        data: { status, finishedAt: new Date() },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message.slice(0, 1000)
          : 'Collection failed';
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

  private async pool<T>(
    items: T[],
    concurrency: number,
    worker: (item: T) => Promise<void>,
  ) {
    let cursor = 0;
    const run = async () => {
      while (cursor < items.length) {
        const item = items[cursor++];
        await worker(item);
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(concurrency, items.length) }, run),
    );
  }
}
