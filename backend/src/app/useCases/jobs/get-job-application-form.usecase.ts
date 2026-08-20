import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IJobOutputDTO } from '../../../domain/dtos';
import { IJobsRepository, JOBS_REPOSITORY_TOKEN } from '../../repositories/jobs.repository.interface';

@Injectable()
export class GetJobApplicationFormUseCase {
  constructor(
    @Inject(JOBS_REPOSITORY_TOKEN)
    private readonly jobsRepository: IJobsRepository,
  ) {}

  async execute(id: string): Promise<IJobOutputDTO> {
    const job = await this.jobsRepository.findApplicationForm(id);
    if (!job) throw new NotFoundException('Job not found');
    if (!job.applicationForm) {
      throw new NotFoundException('Application form has not been synchronized yet');
    }
    return job;
  }
}
