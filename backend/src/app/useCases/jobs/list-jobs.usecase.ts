import { Inject, Injectable } from '@nestjs/common';
import { IJobFilterDTO, IJobOutputDTO, IPaginatedResult } from '../../../domain/dtos';
import { IJobsRepository, JOBS_REPOSITORY_TOKEN } from '../../repositories/jobs.repository.interface';

@Injectable()
export class ListJobsUseCase {
  constructor(
    @Inject(JOBS_REPOSITORY_TOKEN)
    private readonly jobsRepository: IJobsRepository,
  ) {}

  async execute(filter: IJobFilterDTO): Promise<IPaginatedResult<IJobOutputDTO>> {
    return this.jobsRepository.findMany(filter);
  }
}
