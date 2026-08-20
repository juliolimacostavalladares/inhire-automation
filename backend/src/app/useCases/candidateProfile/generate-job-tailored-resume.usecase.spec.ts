import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GenerateJobTailoredResumeUseCase } from './generate-job-tailored-resume.usecase';
import type { IUsersRepository } from '../../repositories/users.repository.interface';
import type { ICandidateProfilesRepository } from '../../repositories/candidate-profiles.repository.interface';
import type { IJobsRepository } from '../../repositories/jobs.repository.interface';
import type { ITailoredResumesRepository } from '../../repositories/tailored-resumes.repository.interface';
import type { IPdfRenderer } from '../../providers/pdf-renderer.interface';
import type { AiService } from '../../../infra/providers/ai/ai.service';
import { CandidateProfileStatus, UserRole } from '../../../domain/enums';

describe('GenerateJobTailoredResumeUseCase', () => {
  let useCase: GenerateJobTailoredResumeUseCase;
  let usersRepository: jest.Mocked<IUsersRepository>;
  let candidateProfilesRepository: jest.Mocked<ICandidateProfilesRepository>;
  let jobsRepository: jest.Mocked<IJobsRepository>;
  let tailoredResumesRepository: jest.Mocked<ITailoredResumesRepository>;
  let pdfRenderer: jest.Mocked<IPdfRenderer>;
  let aiService: jest.Mocked<AiService>;

  const fakeUser = {
    id: 'user-1',
    name: 'Julio Lima',
    email: 'julio@example.com',
    role: UserRole.CANDIDATE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const fakeProfile = {
    id: 'profile-1',
    userId: 'user-1',
    status: CandidateProfileStatus.COMPLETE,
    phone: '22992531720',
    professionalTitle: 'Dev Front-end Senior',
    skills: ['React', 'TypeScript'],
    experiences: [],
    education: [],
    alertsEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const fakeJob = {
    id: 'job-1',
    externalId: 'ext-1',
    tenantId: 'tenant-1',
    title: 'Senior Frontend Engineer',
    url: 'https://example.com/job',
    status: 'PUBLISHED' as const,
    firstSeenAt: new Date(),
    lastSeenAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    tenant: {
      id: 'tenant-1',
      slug: 'tech-corp',
      name: 'Tech Corp',
      origin: 'MANUAL' as const,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  beforeEach(() => {
    usersRepository = {
      findById: jest.fn().mockResolvedValue(fakeUser),
      findByEmail: jest.fn(),
      findWithPasswordByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    candidateProfilesRepository = {
      findByUserId: jest.fn().mockResolvedValue(fakeProfile),
      upsert: jest.fn(),
    };

    jobsRepository = {
      findById: jest.fn().mockResolvedValue(fakeJob),
      createOrUpdate: jest.fn(),
      findMany: jest.fn(),
      findApplicationForm: jest.fn(),
    };

    tailoredResumesRepository = {
      findByUserAndJob: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockImplementation((data) =>
        Promise.resolve({
          id: 'resume-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        }),
      ),
      delete: jest.fn(),
    };

    pdfRenderer = {
      renderHtmlToPdf: jest.fn().mockResolvedValue(Buffer.from('fake-pdf')),
      renderMarkdownToPdf: jest
        .fn()
        .mockResolvedValue(Buffer.from('fake-pdf')),
    };

    aiService = {
      generateStructuredJson: jest.fn().mockResolvedValue({
        targetRole: 'Senior Frontend Engineer',
        markdown: '# JULIO LIMA\n\n### RESUMO PROFISSIONAL\n...',
        matchScore: 94,
        summary: 'Currículo otimizado com foco em React e TypeScript.',
        highlightedKeywords: ['React', 'TypeScript', 'Frontend'],
      }),
      complete: jest.fn(),
      chat: jest.fn(),
      getProviderName: jest.fn().mockReturnValue('mock-ai'),
    } as unknown as jest.Mocked<AiService>;

    useCase = new GenerateJobTailoredResumeUseCase(
      usersRepository,
      candidateProfilesRepository,
      jobsRepository,
      tailoredResumesRepository,
      pdfRenderer,
      aiService,
    );
  });

  it('generates tailored resume with AI and converts to PDF successfully', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      jobId: 'job-1',
    });

    expect(result).toBeDefined();
    expect(result.targetRole).toBe('Senior Frontend Engineer');
    expect(result.matchScore).toBe(94);
    expect(result.markdownContent).toContain('# JULIO LIMA');
    expect(result.pdfBase64).toBe(Buffer.from('fake-pdf').toString('base64'));
    expect(tailoredResumesRepository.upsert.mock.calls).toHaveLength(1);
  });

  it('returns cached resume if already generated and forceRegenerate is false', async () => {
    const cachedResume = {
      id: 'resume-cached',
      userId: 'user-1',
      jobId: 'job-1',
      targetRole: 'Senior Frontend Engineer',
      markdownContent: '# CACHED',
      pdfBase64: 'cached-pdf-base64',
      matchScore: 90,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    tailoredResumesRepository.findByUserAndJob.mockResolvedValueOnce(
      cachedResume,
    );

    const result = await useCase.execute({
      userId: 'user-1',
      jobId: 'job-1',
      forceRegenerate: false,
    });

    expect(result.markdownContent).toBe('# CACHED');
    expect(aiService.generateStructuredJson.mock.calls).toHaveLength(0);
  });

  it('throws NotFoundException if user does not exist', async () => {
    usersRepository.findById.mockResolvedValueOnce(null);

    await expect(
      useCase.execute({ userId: 'invalid', jobId: 'job-1' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException if candidate profile does not exist', async () => {
    candidateProfilesRepository.findByUserId.mockResolvedValueOnce(null);

    await expect(
      useCase.execute({ userId: 'user-1', jobId: 'job-1' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws NotFoundException if job does not exist', async () => {
    jobsRepository.findById.mockResolvedValueOnce(null);

    await expect(
      useCase.execute({ userId: 'user-1', jobId: 'invalid' }),
    ).rejects.toThrow(NotFoundException);
  });
});
