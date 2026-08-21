import { Injectable, Logger } from '@nestjs/common';
import { TenantOrigin } from '../../../domain/enums';
import { InhireClientService } from '../../../infra/providers/inhire/inhire-client.service';
import { DiscoverySourceService } from '../../../infra/services/crawler/discovery-source.service';
import { PrismaService } from '../../../infra/databases/prisma/prisma.service';

export interface IDiscoveryValidationResult {
  discoveredTenantIds: string[];
  processed: number;
  success: number;
  failed: number;
}

@Injectable()
export class DiscoverTenantsUseCase {
  private readonly logger = new Logger(DiscoverTenantsUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sources: DiscoverySourceService,
    private readonly inhire: InhireClientService,
  ) {}

  async collectEvidence() {
    return this.sources.collectAll();
  }

  async validateAndSaveCandidates(
    runId: string,
    candidates: [string, Array<{ source: TenantOrigin; evidenceUrl?: string }>][],
    onProgress?: (processed: number, success: number, failed: number, discovered: number) => Promise<void>,
  ): Promise<IDiscoveryValidationResult> {
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
            data: { status: 'SUCCEEDED' },
          });
          success++;
          return;
        }

        const openJobs = page.jobsPage?.filter(
          (job) => job.jobId && (!job.status || job.status.toLowerCase() === 'published'),
        ) ?? [];

        // Tenants sem vagas abertas NÃO devem ser cadastrados/ativados
        if (openJobs.length === 0) {
          const existing = await this.prisma.tenant.findUnique({
            where: { slug },
            select: { id: true },
          });
          if (existing) {
            await this.prisma.tenant.update({
              where: { id: existing.id },
              data: { active: false, lastValidatedAt: new Date() },
            });
          }
          await this.prisma.crawlRunItem.update({
            where: { id: runItem.id },
            data: { status: 'SUCCEEDED' },
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
            logoUrl: page.logo || null,
            origin: items[0]?.source ?? TenantOrigin.WAYBACK,
            active: true,
            lastValidatedAt: new Date(),
          },
          update: {
            name: page.tenantName || slug,
            ...(page.logo ? { logoUrl: page.logo } : {}),
            active: true,
            lastValidatedAt: new Date(),
          },
        });
        await this.prisma.discoveryEvidence.createMany({
          data: items.map((item) => ({
            tenantId: tenant.id,
            source: item.source,
            evidenceUrl: item.evidenceUrl || `https://${slug}.inhire.app`,
          })),
          skipDuplicates: true,
        });
        await this.prisma.crawlRunItem.update({
          where: { id: runItem.id },
          data: { tenantId: tenant.id, status: 'SUCCEEDED' },
        });
        if (!existing) discoveredTenantIds.push(tenant.id);
        success++;
      } catch (error) {
        failed++;
        const message =
          error instanceof Error
            ? error.message.slice(0, 1000)
            : 'Tenant validation failed';
        this.logger.warn(
          `Discovery validation failed for ${slug}: ${message}`,
        );
        await this.prisma.crawlRunItem.update({
          where: { id: runItem.id },
          data: { status: 'FAILED', error: message },
        });
      } finally {
        processed++;
        if (onProgress) {
          await onProgress(processed, success, failed, discoveredTenantIds.length);
        }
      }
    });

    return {
      discoveredTenantIds,
      processed,
      success,
      failed,
    };
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
