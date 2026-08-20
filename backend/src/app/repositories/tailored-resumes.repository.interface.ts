import type {
  ITailoredResumeInputDTO,
  ITailoredResumeOutputDTO,
} from '../../domain/dtos/tailored-resume.dtos';

export const TAILORED_RESUMES_REPOSITORY_TOKEN = Symbol(
  'TAILORED_RESUMES_REPOSITORY_TOKEN',
);

export interface ITailoredResumesRepository {
  findByUserAndJob(
    userId: string,
    jobId: string,
  ): Promise<ITailoredResumeOutputDTO | null>;

  upsert(data: ITailoredResumeInputDTO): Promise<ITailoredResumeOutputDTO>;

  delete(userId: string, jobId: string): Promise<void>;
}
