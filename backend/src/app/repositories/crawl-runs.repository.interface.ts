import { ICrawlRunOutputDTO, ICreateCrawlRunDTO, IPaginatedResult } from '../../domain/dtos';

export const CRAWL_RUNS_REPOSITORY_TOKEN = Symbol.for('CRAWL_RUNS_REPOSITORY_TOKEN');

export interface ICrawlRunsRepository {
  create(data: ICreateCrawlRunDTO): Promise<ICrawlRunOutputDTO>;
  findById(id: string): Promise<ICrawlRunOutputDTO | null>;
  findMany(page: number, limit: number): Promise<IPaginatedResult<ICrawlRunOutputDTO>>;
}
