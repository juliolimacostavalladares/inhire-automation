import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ICandidateProfileInputDTO,
  ICandidateProfileOutputDTO,
} from '../../domain/dtos/candidate-profile.dtos';
import {
  CandidateProfileSource,
  CandidateProfileStatus,
} from '../../domain/enums';
import { ICandidateProfilesRepository } from '../../app/repositories/candidate-profiles.repository.interface';
import { PrismaService } from '../databases/prisma/prisma.service';

@Injectable()
export class PrismaCandidateProfilesRepository
  implements ICandidateProfilesRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async upsert(
    userId: string,
    data: ICandidateProfileInputDTO,
  ): Promise<ICandidateProfileOutputDTO> {
    const rawData = {
      status: data.status ?? CandidateProfileStatus.NEEDS_REVIEW,
      source: data.source ?? CandidateProfileSource.LINKEDIN_PDF_UPLOAD,
      linkedinProfileUrl: data.linkedinProfileUrl,
      phone: data.phone,
      professionalTitle: data.professionalTitle,
      professionalArea: data.professionalArea,
      seniority: data.seniority,
      location: data.location,
      country: data.country,
      workModalities: (data.workModalities as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      contractTypes: (data.contractTypes as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      salaryExpectation: data.salaryExpectation,
      skills: (data.skills as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      summary: data.summary,
      experiences: (data.experiences as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      education: (data.education as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      alertsEnabled: data.alertsEnabled ?? true,
      sourceFileName: data.sourceFileName,
      sourceFileMime: data.sourceFileMime,
      sourceFileSize: data.sourceFileSize,
      extractedText: data.extractedText,
      sourceImportedAt: data.sourceImportedAt ?? new Date(),
      reviewedAt: data.reviewedAt,
    };

    const profile = await this.prisma.candidateProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...rawData,
      },
      update: {
        ...rawData,
      },
    });

    return this.toOutputDTO(profile);
  }

  async findByUserId(userId: string): Promise<ICandidateProfileOutputDTO | null> {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
    });
    return profile ? this.toOutputDTO(profile) : null;
  }

  private toOutputDTO(profile: {
    id: string;
    userId: string;
    status: unknown;
    source: unknown;
    linkedinProfileUrl?: string | null;
    phone?: string | null;
    professionalTitle?: string | null;
    professionalArea?: string | null;
    seniority?: string | null;
    location?: string | null;
    country?: string | null;
    workModalities?: unknown;
    contractTypes?: unknown;
    salaryExpectation?: string | null;
    skills?: unknown;
    summary?: string | null;
    experiences?: unknown;
    education?: unknown;
    alertsEnabled: boolean;
    sourceFileName?: string | null;
    sourceFileMime?: string | null;
    sourceFileSize?: number | null;
    extractedText?: string | null;
    sourceImportedAt?: Date | null;
    reviewedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): ICandidateProfileOutputDTO {
    return {
      id: profile.id,
      userId: profile.userId,
      status: profile.status as CandidateProfileStatus,
      source: profile.source as CandidateProfileSource,
      linkedinProfileUrl: profile.linkedinProfileUrl,
      phone: profile.phone,
      professionalTitle: profile.professionalTitle,
      professionalArea: profile.professionalArea,
      seniority: profile.seniority,
      location: profile.location,
      country: profile.country,
      workModalities: profile.workModalities as string[] | null,
      contractTypes: profile.contractTypes as string[] | null,
      salaryExpectation: profile.salaryExpectation,
      skills: profile.skills as string[] | null,
      summary: profile.summary,
      experiences: profile.experiences as unknown[] | null,
      education: profile.education as unknown[] | null,
      alertsEnabled: profile.alertsEnabled,
      sourceFileName: profile.sourceFileName,
      sourceFileMime: profile.sourceFileMime,
      sourceFileSize: profile.sourceFileSize,
      extractedText: profile.extractedText,
      sourceImportedAt: profile.sourceImportedAt,
      reviewedAt: profile.reviewedAt,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
