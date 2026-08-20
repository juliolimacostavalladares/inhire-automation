import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ICrawlRunOutputDTO } from '../../../domain/dtos';
import {
  CRAWL_RUNS_REPOSITORY_TOKEN,
  ICrawlRunsRepository,
} from '../../repositories/crawl-runs.repository.interface';

@Injectable()
export class GetRunUseCase {
  constructor(
    @Inject(CRAWL_RUNS_REPOSITORY_TOKEN)
    private readonly repository: ICrawlRunsRepository,
  ) {}

  async execute(id: string): Promise<ICrawlRunOutputDTO> {
    const run = await this.repository.findById(id);
    if (!run) throw new NotFoundException('Run not found');
    return run;
  }
}
