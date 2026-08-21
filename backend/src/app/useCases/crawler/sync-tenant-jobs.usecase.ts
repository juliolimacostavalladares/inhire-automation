import { Injectable, Logger } from '@nestjs/common';
import { JobStatus } from '../../../domain/enums';
import { InhireClientService } from '../../../infra/providers/inhire/inhire-client.service';
import { InhireJob } from '../../../infra/providers/inhire/inhire.types';
import { sanitizeJobDescription } from '../../../infra/utils/job-description.util';
import { buildApplicationForm } from '../../../infra/utils/application-form.util';
import { jobSlug } from '../../../infra/utils/slug.util';
import { PrismaService } from '../../../infra/databases/prisma/prisma.service';

export interface ISyncTenantJobsResult {
  created: number;
  updated: number;
  closed: number;
}

@Injectable()
export class SyncTenantJobsUseCase {
  private readonly logger = new Logger(SyncTenantJobsUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly inhire: InhireClientService,
  ) {}

  async execute(
    tenantId: string,
    tenantSlug: string,
    jobs: InhireJob[],
  ): Promise<ISyncTenantJobsResult> {
    const publishedRaw = [
      ...new Map(
        jobs
          .filter(
            (job) =>
              job.jobId &&
              job.displayName &&
              (!job.status || job.status.toLowerCase() === 'published'),
          )
          .map((job) => [job.jobId, job]),
      ).values(),
    ];

    const published = publishedRaw;
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
    const refreshBefore = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const details = new Map<
      string,
      NonNullable<Awaited<ReturnType<InhireClientService['fetchJobDetail']>>>
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
          error instanceof Error ? error.message : 'Unknown detail error';
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
