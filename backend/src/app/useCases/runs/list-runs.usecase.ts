import { Inject, Injectable } from '@nestjs/common';
import { ICrawlRunOutputDTO, IPaginatedResult } from '../../../domain/dtos';
import {
  CRAWL_RUNS_REPOSITORY_TOKEN,
  ICrawlRunsRepository,
} from '../../repositories/crawl-runs.repository.interface';

@Injectable()
export class ListRunsUseCase {
  constructor(
    @Inject(CRAWL_RUNS_REPOSITORY_TOKEN)
    private readonly repository: ICrawlRunsRepository,
  ) {}

  async execute(page: number, limit: number): Promise<IPaginatedResult<ICrawlRunOutputDTO>> {
    return this.repository.findMany(page, limit);
  }
}
