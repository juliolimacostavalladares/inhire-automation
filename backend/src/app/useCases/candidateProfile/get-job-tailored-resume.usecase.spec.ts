import { NotFoundException } from '@nestjs/common';
import { GetJobTailoredResumeUseCase } from './get-job-tailored-resume.usecase';
import type { ITailoredResumesRepository } from '../../repositories/tailored-resumes.repository.interface';

describe('GetJobTailoredResumeUseCase', () => {
  let useCase: GetJobTailoredResumeUseCase;
  let repository: jest.Mocked<ITailoredResumesRepository>;

  beforeEach(() => {
    repository = {
      findByUserAndJob: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new GetJobTailoredResumeUseCase(repository);
  });

  it('returns resume when found', async () => {
    const resume = {
      id: 'res-1',
      userId: 'u-1',
      jobId: 'j-1',
      targetRole: 'Engenheiro de Software',
      markdownContent: '# Resume',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repository.findByUserAndJob.mockResolvedValueOnce(resume);

    const result = await useCase.execute('u-1', 'j-1');
    expect(result).toEqual(resume);
  });

  it('throws NotFoundException when not found', async () => {
    repository.findByUserAndJob.mockResolvedValueOnce(null);
    await expect(useCase.execute('u-1', 'j-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
