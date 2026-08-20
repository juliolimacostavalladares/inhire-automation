import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job as BullJob } from 'bullmq';
import {
  RESUME_GENERATION_JOB,
  RESUME_GENERATION_QUEUE,
  RESUME_PROGRESS_CHANNEL,
} from '../../providers/queues/queue.constants';
import {
  GenerateJobTailoredResumeUseCase,
  type ResumeProgressEvent,
} from '../../../app/useCases/candidateProfile/generate-job-tailored-resume.usecase';
import { RedisPubSubService } from '../../providers/redis/redis-pubsub.service';

export interface ResumeGenerationJobData {
  userId: string;
  jobId: string;
  forceRegenerate?: boolean;
  language?: 'pt-BR' | 'en';
}

@Injectable()
@Processor(RESUME_GENERATION_QUEUE, { concurrency: 2 })
export class ResumeGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(ResumeGenerationProcessor.name);

  constructor(
    private readonly generateJobTailoredResumeUseCase: GenerateJobTailoredResumeUseCase,
    private readonly redisPubSub: RedisPubSubService,
  ) {
    super();
  }

  async process(job: BullJob<ResumeGenerationJobData>): Promise<void> {
    if (job.name !== RESUME_GENERATION_JOB) return;

    const { userId, jobId, forceRegenerate, language } = job.data;
    const channel = RESUME_PROGRESS_CHANNEL(userId, jobId);

    this.logger.log(`Iniciando processamento em background de currículo para usuário ${userId}, vaga ${jobId}`);

    try {
      const resume = await this.generateJobTailoredResumeUseCase.execute(
        {
          userId,
          jobId,
          forceRegenerate: Boolean(forceRegenerate),
          language: language === 'en' ? 'en' : 'pt-BR',
        },
        (progress: ResumeProgressEvent) => {
          void this.redisPubSub.publish(channel, {
            type: 'progress',
            data: progress,
          });
        },
      );

      await this.redisPubSub.publish(channel, {
        type: 'complete',
        data: { resume },
      });

      this.logger.log(`Currículo gerado e salvo com sucesso em background para usuário ${userId}, vaga ${jobId}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha inesperada ao gerar currículo.';
      this.logger.error(`Erro ao gerar currículo em background para usuário ${userId}, vaga ${jobId}: ${message}`);

      await this.redisPubSub.publish(channel, {
        type: 'error',
        data: { message },
      });

      throw error;
    }
  }
}
