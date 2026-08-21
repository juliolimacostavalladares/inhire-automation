import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ICreateJobInputDTO,
  IJobFilterDTO,
  IJobOutputDTO,
  IPaginatedResult,
} from '../../domain/dtos';
import { JobStatus } from '../../domain/enums';
import { IJobsRepository } from '../../app/repositories/jobs.repository.interface';
import { PrismaService } from '../databases/prisma/prisma.service';

import { getAreaKeywords } from '../utils/job-area-classifier.util';

type JobRecord = Prisma.JobGetPayload<{
  select: {
    id: true;
    externalId: true;
    tenantId: true;
    title: true;
    workplaceType: true;
    location: true;
    sourceStatus: true;
    url: true;
    status: true;
    publishedAt: true;
    firstSeenAt: true;
    lastSeenAt: true;
    closedAt: true;
    createdAt: true;
    updatedAt: true;
    tenant: {
      select: { id: true; slug: true; name: true; logoUrl: true };
    };
  };
}>;

@Injectable()
export class PrismaJobsRepository implements IJobsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createOrUpdate(data: ICreateJobInputDTO): Promise<IJobOutputDTO> {
    const job = await this.prisma.job.upsert({
      where: {
        tenantId_externalId: {
          tenantId: data.tenantId,
          externalId: data.externalId,
        },
      },
      create: {
        externalId: data.externalId,
        tenantId: data.tenantId,
        title: data.title,
        workplaceType: data.workplaceType,
        location: data.location,
        sourceStatus: data.sourceStatus,
        descriptionHtml: data.descriptionHtml,
        applicationForm: (data.applicationForm as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        publishedAt: data.publishedAt,
        lastPublishedAt: data.lastPublishedAt,
        detailFetchedAt: data.detailFetchedAt,
        url: data.url,
        status: data.status ?? JobStatus.PUBLISHED,
        firstSeenAt: data.firstSeenAt ?? new Date(),
        lastSeenAt: data.lastSeenAt ?? new Date(),
      },
      update: {
        title: data.title,
        workplaceType: data.workplaceType,
        location: data.location,
        sourceStatus: data.sourceStatus,
        ...(data.descriptionHtml ? { descriptionHtml: data.descriptionHtml } : {}),
        ...(data.applicationForm !== undefined
          ? { applicationForm: data.applicationForm as Prisma.InputJsonValue }
          : {}),
        ...(data.detailFetchedAt ? { detailFetchedAt: data.detailFetchedAt } : {}),
        status: data.status ?? JobStatus.PUBLISHED,
        lastSeenAt: new Date(),
      },
      include: {
        tenant: {
          select: { id: true, slug: true, name: true, logoUrl: true },
        },
      },
    });
    return this.toOutputDTO(job);
  }

  async findById(id: string): Promise<IJobOutputDTO | null> {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        tenant: {
          select: { id: true, slug: true, name: true, logoUrl: true },
        },
      },
    });
    return job ? this.toOutputDTO(job) : null;
  }

  async findMany(filter: IJobFilterDTO): Promise<IPaginatedResult<IJobOutputDTO>> {
    const areaKeywords = filter.area ? getAreaKeywords(filter.area) : [];
    const areaCondition: Prisma.JobWhereInput | undefined =
      areaKeywords.length > 0
        ? {
            OR: areaKeywords.map((keyword) => ({
              title: { contains: keyword, mode: 'insensitive' as const },
            })),
          }
        : undefined;

    const where: Prisma.JobWhereInput = {
      tenantId: filter.tenantId,
      tenant: filter.tenantSlug ? { slug: filter.tenantSlug } : undefined,
      status: filter.status,
      workplaceType: filter.workplaceType
        ? { contains: filter.workplaceType, mode: 'insensitive' }
        : undefined,
      location: filter.location
        ? { contains: filter.location, mode: 'insensitive' }
        : undefined,
      title: filter.title
        ? { contains: filter.title, mode: 'insensitive' }
        : undefined,
      ...(areaCondition ? { AND: [areaCondition] } : {}),
      firstSeenAt:
        filter.firstSeenFrom || filter.firstSeenTo
          ? {
              gte: filter.firstSeenFrom ? new Date(filter.firstSeenFrom) : undefined,
              lte: filter.firstSeenTo ? new Date(filter.firstSeenTo) : undefined,
            }
          : undefined,
      publishedAt:
        filter.publishedFrom || filter.publishedTo
          ? {
              gte: filter.publishedFrom ? new Date(filter.publishedFrom) : undefined,
              lte: filter.publishedTo ? new Date(filter.publishedTo) : undefined,
            }
          : undefined,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where,
        select: {
          id: true,
          externalId: true,
          tenantId: true,
          title: true,
          workplaceType: true,
          location: true,
          sourceStatus: true,
          url: true,
          status: true,
          publishedAt: true,
          firstSeenAt: true,
          lastSeenAt: true,
          closedAt: true,
          createdAt: true,
          updatedAt: true,
          tenant: {
            select: { id: true, slug: true, name: true, logoUrl: true },
          },
        },
        orderBy: [{ firstSeenAt: 'desc' }, { id: 'desc' }],
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      data: data.map((j: JobRecord) => this.toOutputDTO(j)),
      meta: {
        total,
        page: filter.page,
        limit: filter.limit,
        pages: Math.ceil(total / filter.limit) || 1,
      },
    };
  }

  async findApplicationForm(id: string): Promise<IJobOutputDTO | null> {
    const job = await this.prisma.job.findUnique({
      where: { id },
      select: {
        id: true,
        externalId: true,
        tenantId: true,
        title: true,
        url: true,
        status: true,
        detailFetchedAt: true,
        applicationForm: true,
        firstSeenAt: true,
        lastSeenAt: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: { id: true, slug: true, name: true, logoUrl: true },
        },
      },
    });
    return job ? this.toOutputDTO(job) : null;
  }

  private toOutputDTO(job: {
    id: string;
    externalId: string;
    tenantId: string;
    title: string;
    workplaceType?: string | null;
    location?: string | null;
    sourceStatus?: string | null;
    descriptionHtml?: string | null;
    applicationForm?: unknown;
    publishedAt?: Date | null;
    firstSeenAt: Date;
    lastSeenAt: Date;
    closedAt?: Date | null;
    url: string;
    status: unknown;
    createdAt: Date;
    updatedAt: Date;
    tenant?: {
      id: string;
      slug: string;
      name: string;
      logoUrl?: string | null;
    } | null;
  }): IJobOutputDTO {
    return {
      id: job.id,
      externalId: job.externalId,
      tenantId: job.tenantId,
      title: job.title,
      workplaceType: job.workplaceType ?? null,
      location: job.location ?? null,
      sourceStatus: job.sourceStatus ?? null,
      descriptionHtml: job.descriptionHtml ?? null,
      applicationForm: job.applicationForm ?? null,
      publishedAt: job.publishedAt ?? null,
      firstSeenAt: job.firstSeenAt,
      lastSeenAt: job.lastSeenAt,
      closedAt: job.closedAt ?? null,
      url: job.url,
      status: job.status as JobStatus,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      tenant: job.tenant ?? undefined,
    };
  }
}
