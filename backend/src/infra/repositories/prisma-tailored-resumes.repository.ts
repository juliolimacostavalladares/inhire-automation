import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  ITailoredResumeInputDTO,
  ITailoredResumeOutputDTO,
} from '../../domain/dtos/tailored-resume.dtos';
import type { ITailoredResumesRepository } from '../../app/repositories/tailored-resumes.repository.interface';
import { PrismaService } from '../databases/prisma/prisma.service';

@Injectable()
export class PrismaTailoredResumesRepository
  implements ITailoredResumesRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findByUserAndJob(
    userId: string,
    jobId: string,
  ): Promise<ITailoredResumeOutputDTO | null> {
    const record = await this.prisma.tailoredResume.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId,
        },
      },
    });

    if (!record) return null;

    return {
      id: record.id,
      userId: record.userId,
      jobId: record.jobId,
      targetRole: record.targetRole,
      markdownContent: record.markdownContent,
      pdfBase64: record.pdfBase64,
      matchScore: record.matchScore,
      summary: record.summary,
      highlightedKeywords: Array.isArray(record.highlightedKeywords)
        ? (record.highlightedKeywords as unknown as string[])
        : null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async upsert(
    data: ITailoredResumeInputDTO,
  ): Promise<ITailoredResumeOutputDTO> {
    const rawData = {
      targetRole: data.targetRole,
      markdownContent: data.markdownContent,
      pdfBase64: data.pdfBase64 ?? null,
      matchScore: data.matchScore ?? null,
      summary: data.summary ?? null,
      highlightedKeywords: data.highlightedKeywords
        ? (data.highlightedKeywords as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    };

    const record = await this.prisma.tailoredResume.upsert({
      where: {
        userId_jobId: {
          userId: data.userId,
          jobId: data.jobId,
        },
      },
      create: {
        userId: data.userId,
        jobId: data.jobId,
        ...rawData,
      },
      update: {
        ...rawData,
      },
    });

    return {
      id: record.id,
      userId: record.userId,
      jobId: record.jobId,
      targetRole: record.targetRole,
      markdownContent: record.markdownContent,
      pdfBase64: record.pdfBase64,
      matchScore: record.matchScore,
      summary: record.summary,
      highlightedKeywords: Array.isArray(record.highlightedKeywords)
        ? (record.highlightedKeywords as unknown as string[])
        : null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async delete(userId: string, jobId: string): Promise<void> {
    await this.prisma.tailoredResume.deleteMany({
      where: { userId, jobId },
    });
  }
}
