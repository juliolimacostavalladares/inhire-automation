import {
  ICreateJobInputDTO,
  IJobFilterDTO,
  IJobOutputDTO,
  IPaginatedResult,
} from '../../domain/dtos';

export const JOBS_REPOSITORY_TOKEN = Symbol.for('JOBS_REPOSITORY_TOKEN');

export interface IJobsRepository {
  createOrUpdate(data: ICreateJobInputDTO): Promise<IJobOutputDTO>;
  findById(id: string): Promise<IJobOutputDTO | null>;
  findMany(filter: IJobFilterDTO): Promise<IPaginatedResult<IJobOutputDTO>>;
  findApplicationForm(id: string): Promise<IJobOutputDTO | null>;
}
