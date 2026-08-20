import { Module } from '@nestjs/common';
import { JobsController } from '../../http/controllers/jobs.controller';
import { ListJobsUseCase } from '../../../app/useCases/jobs/list-jobs.usecase';
import { GetJobDetailUseCase } from '../../../app/useCases/jobs/get-job-detail.usecase';
import { GetJobApplicationFormUseCase } from '../../../app/useCases/jobs/get-job-application-form.usecase';
import { JOBS_REPOSITORY_TOKEN } from '../../../app/repositories/jobs.repository.interface';
import { PrismaJobsRepository } from '../../../infra/repositories/prisma-jobs.repository';

@Module({
  controllers: [JobsController],
  providers: [
    { provide: JOBS_REPOSITORY_TOKEN, useClass: PrismaJobsRepository },
    ListJobsUseCase,
    GetJobDetailUseCase,
    GetJobApplicationFormUseCase,
  ],
  exports: [
    JOBS_REPOSITORY_TOKEN,
    ListJobsUseCase,
    GetJobDetailUseCase,
    GetJobApplicationFormUseCase,
  ],
})
export class JobsModule {}
