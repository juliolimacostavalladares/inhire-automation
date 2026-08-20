import { Inject, Injectable } from '@nestjs/common';
import { ICrawlRunOutputDTO, ICreateCrawlRunDTO } from '../../../domain/dtos';
import {
  CRAWL_RUNS_REPOSITORY_TOKEN,
  ICrawlRunsRepository,
} from '../../repositories/crawl-runs.repository.interface';

@Injectable()
export class CreateRunUseCase {
  constructor(
    @Inject(CRAWL_RUNS_REPOSITORY_TOKEN)
    private readonly repository: ICrawlRunsRepository,
  ) {}

  async execute(data: ICreateCrawlRunDTO): Promise<ICrawlRunOutputDTO> {
    return this.repository.create(data);
  }
}
