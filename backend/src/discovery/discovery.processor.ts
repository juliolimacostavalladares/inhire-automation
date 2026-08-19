import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { RunStatus, RunTrigger, RunType, TenantOrigin } from "@prisma/client";
import { Job as BullJob, Queue } from "bullmq";
import { InhireClientService } from "../inhire/inhire-client.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  COLLECTION_JOB,
  COLLECTION_QUEUE,
  DISCOVERY_JOB,
  DISCOVERY_QUEUE,
} from "../queues/queue.constants";
import { DiscoverySourceService } from "./discovery-source.service";

@Injectable()
@Processor(DISCOVERY_QUEUE, { concurrency: 1 })
export class DiscoveryProcessor extends WorkerHost {
  private readonly logger = new Logger(DiscoveryProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sources: DiscoverySourceService,
    private readonly inhire: InhireClientService,
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
      const evidence = await this.sources.collectAll();
      const grouped = new Map<string, typeof evidence>();
      for (const item of evidence)
        grouped.set(item.slug, [...(grouped.get(item.slug) ?? []), item]);
      const candidates = [...grouped.entries()];
      await this.prisma.crawlRun.update({
        where: { id: runId },
        data: { totalItems: candidates.length },
      });
      const discoveredTenantIds: string[] = [];
      let processed = 0;
      let success = 0;
      let failed = 0;

      await this.pool(candidates, 12, async ([slug, items]) => {
        const runItem = await this.prisma.crawlRunItem.create({
          data: { runId, subject: slug },
        });
        try {
          const page = await this.inhire.fetchTenant(slug);
          if (!page) {
            await this.prisma.crawlRunItem.update({
              where: { id: runItem.id },
              data: { status: "SUCCEEDED" },
            });
            success++;
            return;
          }
          const existing = await this.prisma.tenant.findUnique({
            where: { slug },
            select: { id: true },
          });
          const tenant = await this.prisma.tenant.upsert({
            where: { slug },
            create: {
              slug,
              name: page.tenantName || slug,
              origin: items[0]?.source ?? TenantOrigin.WAYBACK,
              lastValidatedAt: new Date(),
            },
            update: {
              name: page.tenantName || slug,
              lastValidatedAt: new Date(),
            },
          });
          await this.prisma.discoveryEvidence.createMany({
            data: items.map((item) => ({
              tenantId: tenant.id,
              source: item.source,
              evidenceUrl: item.evidenceUrl,
            })),
            skipDuplicates: true,
          });
          await this.prisma.crawlRunItem.update({
            where: { id: runItem.id },
            data: { tenantId: tenant.id, status: "SUCCEEDED" },
          });
          if (!existing) discoveredTenantIds.push(tenant.id);
          success++;
        } catch (error) {
          failed++;
          const message =
            error instanceof Error
              ? error.message.slice(0, 1_000)
              : "Tenant validation failed";
          this.logger.warn(
            `Discovery validation failed for ${slug}: ${message}`,
          );
          await this.prisma.crawlRunItem.update({
            where: { id: runItem.id },
            data: { status: "FAILED", error: message },
          });
        } finally {
          processed++;
          await this.prisma.crawlRun.update({
            where: { id: runId },
            data: {
              processedItems: processed,
              successItems: success,
              failedItems: failed,
              discovered: discoveredTenantIds.length,
            },
          });
        }
      });

      const status =
        failed === 0
          ? RunStatus.SUCCEEDED
          : success
            ? RunStatus.PARTIAL
            : RunStatus.FAILED;
      await this.prisma.crawlRun.update({
        where: { id: runId },
        data: { status, finishedAt: new Date() },
      });
      if (discoveredTenantIds.length)
        await this.enqueueInitialCollection(discoveredTenantIds);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message.slice(0, 1_000)
          : "Discovery failed";
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
      { attempts: 3, backoff: { type: "exponential", delay: 1_000 } },
    );
  }

  private async pool<T>(
    items: T[],
    concurrency: number,
    worker: (item: T) => Promise<void>,
  ) {
    let cursor = 0;
    const run = async () => {
      while (cursor < items.length) await worker(items[cursor++]);
    };
    await Promise.all(
      Array.from({ length: Math.min(concurrency, items.length) }, run),
    );
  }
}
