import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { JobsController } from '../../http/controllers/jobs.controller';
import { ListJobsUseCase } from '../../../app/useCases/jobs/list-jobs.usecase';
import { GetJobDetailUseCase } from '../../../app/useCases/jobs/get-job-detail.usecase';
import { GetJobApplicationFormUseCase } from '../../../app/useCases/jobs/get-job-application-form.usecase';
import { GenerateJobTailoredResumeUseCase } from '../../../app/useCases/candidateProfile/generate-job-tailored-resume.usecase';
import { GetJobTailoredResumeUseCase } from '../../../app/useCases/candidateProfile/get-job-tailored-resume.usecase';
import { DownloadJobTailoredResumePdfUseCase } from '../../../app/useCases/candidateProfile/download-job-tailored-resume-pdf.usecase';
import { JOBS_REPOSITORY_TOKEN } from '../../../app/repositories/jobs.repository.interface';
import { TAILORED_RESUMES_REPOSITORY_TOKEN } from '../../../app/repositories/tailored-resumes.repository.interface';
import { CANDIDATE_PROFILES_REPOSITORY_TOKEN } from '../../../app/repositories/candidate-profiles.repository.interface';
import { USERS_REPOSITORY_TOKEN } from '../../../app/repositories/users.repository.interface';
import { PrismaJobsRepository } from '../../../infra/repositories/prisma-jobs.repository';
import { PrismaTailoredResumesRepository } from '../../../infra/repositories/prisma-tailored-resumes.repository';
import { PrismaCandidateProfilesRepository } from '../../../infra/repositories/prisma-candidate-profiles.repository';
import { PrismaUsersRepository } from '../../../infra/repositories/prisma-users.repository';
import { AiModule } from '../../../infra/providers/ai/ai.module';
import { PdfModule } from '../../../infra/providers/pdf/pdf.module';
import { RESUME_GENERATION_QUEUE } from '../../../infra/providers/queues/queue.constants';
import { ResumeGenerationProcessor } from '../../../infra/services/resume/resume-generation.processor';

@Module({
  imports: [
    AiModule,
    PdfModule,
    BullModule.registerQueue({ name: RESUME_GENERATION_QUEUE }),
  ],
  controllers: [JobsController],
  providers: [
    { provide: JOBS_REPOSITORY_TOKEN, useClass: PrismaJobsRepository },
    {
      provide: TAILORED_RESUMES_REPOSITORY_TOKEN,
      useClass: PrismaTailoredResumesRepository,
    },
    {
      provide: CANDIDATE_PROFILES_REPOSITORY_TOKEN,
      useClass: PrismaCandidateProfilesRepository,
    },
    { provide: USERS_REPOSITORY_TOKEN, useClass: PrismaUsersRepository },
    ListJobsUseCase,
    GetJobDetailUseCase,
    GetJobApplicationFormUseCase,
    GenerateJobTailoredResumeUseCase,
    GetJobTailoredResumeUseCase,
    DownloadJobTailoredResumePdfUseCase,
    ResumeGenerationProcessor,
  ],
  exports: [
    JOBS_REPOSITORY_TOKEN,
    TAILORED_RESUMES_REPOSITORY_TOKEN,
    ListJobsUseCase,
    GetJobDetailUseCase,
    GetJobApplicationFormUseCase,
    GenerateJobTailoredResumeUseCase,
    GetJobTailoredResumeUseCase,
    DownloadJobTailoredResumePdfUseCase,
    ResumeGenerationProcessor,
    BullModule,
  ],
})
export class JobsModule {}

