import { ListRunsUseCase } from './list-runs.usecase';
import { ICrawlRunsRepository } from '../../repositories/crawl-runs.repository.interface';
import { RunStatus, RunTrigger, RunType } from '../../../domain/enums';

describe('ListRunsUseCase (Clean Architecture)', () => {
  let useCase: ListRunsUseCase;
  let findManyMock: jest.Mock;

  beforeEach(() => {
    findManyMock = jest.fn();
    const repository: ICrawlRunsRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findMany: findManyMock,
    };

    useCase = new ListRunsUseCase(repository);
  });

  it('queries runs through repository port', async () => {
    const mockOutput = {
      data: [
        {
          id: 'run-1',
          type: RunType.COLLECTION,
          trigger: RunTrigger.MANUAL,
          status: RunStatus.SUCCEEDED,
          totalItems: 5,
          processedItems: 5,
          successItems: 5,
          failedItems: 0,
          discovered: 0,
          jobsCreated: 2,
          jobsUpdated: 3,
          jobsClosed: 0,
          createdAt: new Date(),
        },
      ],
      meta: { total: 1, page: 1, limit: 10, pages: 1 },
    };

    findManyMock.mockResolvedValue(mockOutput);

    const result = await useCase.execute(1, 10);
    expect(result).toBe(mockOutput);
    expect(findManyMock).toHaveBeenCalledWith(1, 10);
  });
});
