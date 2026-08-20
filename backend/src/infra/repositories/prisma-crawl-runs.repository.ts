import { Injectable } from '@nestjs/common';
import {
  ICrawlRunOutputDTO,
  ICreateCrawlRunDTO,
  IPaginatedResult,
} from '../../domain/dtos';
import { RunStatus, RunTrigger, RunType } from '../../domain/enums';
import { ICrawlRunsRepository } from '../../app/repositories/crawl-runs.repository.interface';
import { PrismaService } from '../databases/prisma/prisma.service';

@Injectable()
export class PrismaCrawlRunsRepository implements ICrawlRunsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: ICreateCrawlRunDTO): Promise<ICrawlRunOutputDTO> {
    const run = await this.prisma.crawlRun.create({
      data: {
        type: data.type,
        trigger: data.trigger,
        totalItems: data.totalItems ?? 0,
      },
    });
    return this.toOutputDTO(run);
  }

  async findById(id: string): Promise<ICrawlRunOutputDTO | null> {
    const run = await this.prisma.crawlRun.findUnique({
      where: { id },
      include: { items: true },
    });
    return run ? this.toOutputDTO(run) : null;
  }

  async findMany(
    page: number,
    limit: number,
  ): Promise<IPaginatedResult<ICrawlRunOutputDTO>> {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.crawlRun.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.crawlRun.count(),
    ]);

    return {
      data: data.map((r) => this.toOutputDTO(r)),
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    };
  }

  private toOutputDTO(run: {
    id: string;
    type: unknown;
    trigger: unknown;
    status: unknown;
    totalItems: number;
    processedItems: number;
    successItems: number;
    failedItems: number;
    discovered: number;
    jobsCreated: number;
    jobsUpdated: number;
    jobsClosed: number;
    error?: string | null;
    startedAt?: Date | null;
    finishedAt?: Date | null;
    createdAt: Date;
  }): ICrawlRunOutputDTO {
    return {
      id: run.id,
      type: run.type as RunType,
      trigger: run.trigger as RunTrigger,
      status: run.status as RunStatus,
      totalItems: run.totalItems,
      processedItems: run.processedItems,
      successItems: run.successItems,
      failedItems: run.failedItems,
      discovered: run.discovered,
      jobsCreated: run.jobsCreated,
      jobsUpdated: run.jobsUpdated,
      jobsClosed: run.jobsClosed,
      error: run.error ?? null,
      startedAt: run.startedAt ?? null,
      finishedAt: run.finishedAt ?? null,
      createdAt: run.createdAt,
    };
  }
}
