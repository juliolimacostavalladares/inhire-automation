import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Job as BullJob } from "bullmq";
import { JobStatus, RunItemStatus, RunStatus } from "@prisma/client";
import { InhireClientService } from "../inhire/inhire-client.service";
import { InhireJob } from "../inhire/inhire.types";
import { sanitizeJobDescription } from "../jobs/job-description.util";
import { buildApplicationForm } from "../jobs/application-form.util";
import { PrismaService } from "../prisma/prisma.service";
import { COLLECTION_JOB, COLLECTION_QUEUE } from "../queues/queue.constants";
import { jobSlug } from "../tenants/slug.util";

type CollectionData = { runId: string; tenantIds?: string[] };
type CollectionResult = { created: number; updated: number; closed: number };

@Injectable()
@Processor(COLLECTION_QUEUE, { concurrency: 1 })
export class CollectionProcessor extends WorkerHost {
  private readonly logger = new Logger(CollectionProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly inhire: InhireClientService,
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
        orderBy: { id: "asc" },
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
          if (!page) throw new Error("Tenant was not confirmed by InHire");
          const result = await this.syncTenantJobs(
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
              ? error.message.slice(0, 1_000)
              : "Unknown collection error";
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
          ? error.message.slice(0, 1_000)
          : "Collection failed";
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

  private async syncTenantJobs(
    tenantId: string,
    tenantSlug: string,
    jobs: InhireJob[],
  ): Promise<CollectionResult> {
    const published = [
      ...new Map(
        jobs
          .filter(
            (job) =>
              job.jobId &&
              job.displayName &&
              (!job.status || job.status.toLowerCase() === "published"),
          )
          .map((job) => [job.jobId, job]),
      ).values(),
    ];
    const externalIds = published.map((job) => job.jobId);
    const existing = await this.prisma.job.findMany({
      where: { tenantId, externalId: { in: externalIds } },
      select: {
        externalId: true,
        descriptionHtml: true,
        applicationForm: true,
        detailFetchedAt: true,
      },
    });
    const existingIds = new Set(existing.map((job) => job.externalId));
    const existingById = new Map(existing.map((job) => [job.externalId, job]));
    const now = new Date();
    const refreshBefore = new Date(now.getTime() - 24 * 60 * 60 * 1_000);
    const details = new Map<
      string,
      NonNullable<Awaited<ReturnType<InhireClientService["fetchJobDetail"]>>>
    >();
    const detailCandidates = published.filter((job) => {
      const current = existingById.get(job.jobId);
      return (
        !current ||
        !current.descriptionHtml ||
        !current.applicationForm ||
        !current.detailFetchedAt ||
        current.detailFetchedAt < refreshBefore
      );
    });

    await this.pool(detailCandidates, 2, async (source) => {
      try {
        const detail = await this.inhire.fetchJobDetail(
          tenantSlug,
          source.jobId,
        );
        if (detail) details.set(source.jobId, detail);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown detail error";
        this.logger.warn(
          `Job detail failed for ${tenantSlug}/${source.jobId}: ${message}`,
        );
      }
    });

    return this.prisma.$transaction(async (tx) => {
      for (const source of published) {
        const detail = details.get(source.jobId);
        const title = detail?.displayName || source.displayName;
        const detailData = detail
          ? {
              descriptionHtml: sanitizeJobDescription(detail.description),
              applicationForm: buildApplicationForm(detail),
              publishedAt: this.parseDate(detail.publishedAt),
              lastPublishedAt: this.parseDate(detail.lastPublishedAt),
              detailFetchedAt: now,
            }
          : {};
        const data = {
          title,
          workplaceType: detail?.workplaceType || source.workplaceType || null,
          location: detail?.location || source.location || null,
          sourceStatus: detail?.status || source.status || null,
          url: `https://${tenantSlug}.inhire.app/vagas/${source.jobId}/${jobSlug(title)}`,
          status: JobStatus.PUBLISHED,
          lastSeenAt: now,
          closedAt: null,
          ...detailData,
        };
        await tx.job.upsert({
          where: {
            tenantId_externalId: { tenantId, externalId: source.jobId },
          },
          create: { tenantId, externalId: source.jobId, ...data },
          update: data,
        });
      }
      const closed = await tx.job.updateMany({
        where: {
          tenantId,
          status: JobStatus.PUBLISHED,
          ...(externalIds.length ? { externalId: { notIn: externalIds } } : {}),
        },
        data: { status: JobStatus.CLOSED, closedAt: now },
      });
      return {
        created: published.filter((job) => !existingIds.has(job.jobId)).length,
        updated: published.filter((job) => existingIds.has(job.jobId)).length,
        closed: closed.count,
      };
    });
  }

  private parseDate(value?: string): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
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
