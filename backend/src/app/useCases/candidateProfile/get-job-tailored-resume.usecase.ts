import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ITailoredResumeOutputDTO } from '../../../domain/dtos/tailored-resume.dtos';
import {
  TAILORED_RESUMES_REPOSITORY_TOKEN,
  type ITailoredResumesRepository,
} from '../../repositories/tailored-resumes.repository.interface';

@Injectable()
export class GetJobTailoredResumeUseCase {
  constructor(
    @Inject(TAILORED_RESUMES_REPOSITORY_TOKEN)
    private readonly repository: ITailoredResumesRepository,
  ) {}

  async execute(
    userId: string,
    jobId: string,
  ): Promise<ITailoredResumeOutputDTO> {
    const resume = await this.repository.findByUserAndJob(userId, jobId);
    if (!resume) {
      throw new NotFoundException(
        'Nenhum currículo gerado para esta vaga ainda.',
      );
    }
    return resume;
  }
}
