import { Job as BullJob } from 'bullmq';
import {
  ResumeGenerationProcessor,
  ResumeGenerationJobData,
} from './resume-generation.processor';
import type { GenerateJobTailoredResumeUseCase } from '../../../app/useCases/candidateProfile/generate-job-tailored-resume.usecase';
import type { RedisPubSubService } from '../../providers/redis/redis-pubsub.service';
import {
  RESUME_GENERATION_JOB,
  RESUME_PROGRESS_CHANNEL,
} from '../../providers/queues/queue.constants';

describe('ResumeGenerationProcessor', () => {
  let processor: ResumeGenerationProcessor;
  const mockExecute = jest.fn();
  const mockPublish = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    const generateUseCaseMock = {
      execute: mockExecute,
    } as unknown as GenerateJobTailoredResumeUseCase;

    const redisPubSubMock = {
      publish: mockPublish,
      subscribe: jest.fn(),
      onModuleDestroy: jest.fn(),
    } as unknown as RedisPubSubService;

    processor = new ResumeGenerationProcessor(
      generateUseCaseMock,
      redisPubSubMock,
    );
  });

  it('deve processar job com sucesso e publicar complete no Redis Pub/Sub', async () => {
    const fakeResume = {
      id: 'resume-1',
      userId: 'user-1',
      jobId: 'job-1',
      targetRole: 'Desenvolvedor Frontend',
      markdownContent: '# Currículo',
      pdfBase64: 'base64...',
      matchScore: 90,
      summary: 'Alinhado',
      highlightedKeywords: ['React'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockExecute.mockResolvedValueOnce(fakeResume);

    const job = {
      name: RESUME_GENERATION_JOB,
      data: {
        userId: 'user-1',
        jobId: 'job-1',
        forceRegenerate: false,
        language: 'pt-BR',
      },
    } as BullJob<ResumeGenerationJobData>;

    await processor.process(job);

    expect(mockExecute).toHaveBeenCalledWith(
      {
        userId: 'user-1',
        jobId: 'job-1',
        forceRegenerate: false,
        language: 'pt-BR',
      },
      expect.any(Function),
    );

    expect(mockPublish).toHaveBeenCalledWith(
      RESUME_PROGRESS_CHANNEL('user-1', 'job-1'),
      {
        type: 'complete',
        data: { resume: fakeResume },
      },
    );
  });

  it('deve publicar erro no Redis Pub/Sub e relançar erro caso a geração falhe', async () => {
    mockExecute.mockRejectedValueOnce(new Error('Erro de IA'));

    const job = {
      name: RESUME_GENERATION_JOB,
      data: {
        userId: 'user-1',
        jobId: 'job-1',
      },
    } as BullJob<ResumeGenerationJobData>;

    await expect(processor.process(job)).rejects.toThrow('Erro de IA');

    expect(mockPublish).toHaveBeenCalledWith(
      RESUME_PROGRESS_CHANNEL('user-1', 'job-1'),
      {
        type: 'error',
        data: { message: 'Erro de IA' },
      },
    );
  });

  it('deve ignorar jobs com nome diferente', async () => {
    const job = {
      name: 'other-job',
      data: {
        userId: 'user-1',
        jobId: 'job-1',
      },
    } as BullJob<ResumeGenerationJobData>;

    await processor.process(job);

    expect(mockExecute).not.toHaveBeenCalled();
  });
});
