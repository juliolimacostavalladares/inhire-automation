import { ListJobsUseCase } from './list-jobs.usecase';
import { IJobsRepository } from '../../repositories/jobs.repository.interface';
import { JobStatus } from '../../../domain/enums';

describe('ListJobsUseCase (Clean Architecture)', () => {
  let useCase: ListJobsUseCase;
  let findManyMock: jest.Mock;

  beforeEach(() => {
    findManyMock = jest.fn();
    const jobsRepository: IJobsRepository = {
      createOrUpdate: jest.fn(),
      findById: jest.fn(),
      findMany: findManyMock,
      findApplicationForm: jest.fn(),
    };

    useCase = new ListJobsUseCase(jobsRepository);
  });

  it('delegates querying jobs to repository port', async () => {
    const mockOutput = {
      data: [
        {
          id: 'job-1',
          externalId: 'ext-1',
          tenantId: 'tenant-1',
          title: 'Software Engineer',
          url: 'https://inhire.app',
          status: JobStatus.PUBLISHED,
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      meta: { total: 1, page: 1, limit: 10, pages: 1 },
    };

    findManyMock.mockResolvedValue(mockOutput);

    const result = await useCase.execute({
      page: 1,
      limit: 10,
      status: JobStatus.PUBLISHED,
    });

    expect(result).toBe(mockOutput);
    expect(findManyMock).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      status: JobStatus.PUBLISHED,
    });
  });
});
