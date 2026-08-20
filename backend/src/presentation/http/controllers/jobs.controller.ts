import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Logger,
  Param,
  Post,
  Query,
  Res,
  Sse,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Observable } from 'rxjs';
import type { MessageEvent } from '@nestjs/common';
import type { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AllowJwt, ApiKeyGuard, Public, RequireUser } from '../guards/api-key.guard';
import { CurrentAuth, type AuthContext } from '../guards/auth-context';
import { QueryJobsDto } from '../dto/query-jobs.dto';
import { GenerateTailoredResumeDto } from '../dto/tailored-resume.dto';
import { ListJobsUseCase } from '../../../app/useCases/jobs/list-jobs.usecase';
import { GetJobDetailUseCase } from '../../../app/useCases/jobs/get-job-detail.usecase';
import { GetJobApplicationFormUseCase } from '../../../app/useCases/jobs/get-job-application-form.usecase';
import { GetJobTailoredResumeUseCase } from '../../../app/useCases/candidateProfile/get-job-tailored-resume.usecase';
import { DownloadJobTailoredResumePdfUseCase } from '../../../app/useCases/candidateProfile/download-job-tailored-resume-pdf.usecase';
import {
  TAILORED_RESUMES_REPOSITORY_TOKEN,
  type ITailoredResumesRepository,
} from '../../../app/repositories/tailored-resumes.repository.interface';
import {
  RESUME_GENERATION_JOB,
  RESUME_GENERATION_QUEUE,
  RESUME_PROGRESS_CHANNEL,
} from '../../../infra/providers/queues/queue.constants';
import { RedisPubSubService } from '../../../infra/providers/redis/redis-pubsub.service';
import type { ResumeGenerationJobData } from '../../../infra/services/resume/resume-generation.processor';
import { enforceJobsListPolicy } from '../../../infra/utils/jobs-access';
import type { Environment } from '../../../infra/config/environment';

@Controller('jobs')
@UseGuards(ApiKeyGuard)
export class JobsController {
  private readonly logger = new Logger(JobsController.name);

  constructor(
    private readonly listJobsUseCase: ListJobsUseCase,
    private readonly getJobDetailUseCase: GetJobDetailUseCase,
    private readonly getJobApplicationFormUseCase: GetJobApplicationFormUseCase,
    private readonly getJobTailoredResumeUseCase: GetJobTailoredResumeUseCase,
    private readonly downloadJobTailoredResumePdfUseCase: DownloadJobTailoredResumePdfUseCase,
    @Inject(TAILORED_RESUMES_REPOSITORY_TOKEN)
    private readonly tailoredResumesRepository: ITailoredResumesRepository,
    @InjectQueue(RESUME_GENERATION_QUEUE)
    private readonly resumeQueue: Queue<ResumeGenerationJobData>,
    private readonly redisPubSub: RedisPubSubService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Environment, true>,
  ) {}

  @Public()
  @Get()
  async list(
    @Query() query: QueryJobsDto,
    @CurrentAuth() auth?: AuthContext,
  ) {
    enforceJobsListPolicy(query, auth);
    return this.listJobsUseCase.execute(query);
  }

  @Public()
  @Get(':id')
  async get(@Param('id') id: string) {
    return this.getJobDetailUseCase.execute(id);
  }

  @Public()
  @Get(':id/application-form')
  async getApplicationForm(@Param('id') id: string) {
    return this.getJobApplicationFormUseCase.execute(id);
  }

  /**
   * SSE: Acompanha a geração de currículo em tempo real via Redis Pub/Sub.
   * O processo roda independentemente na fila BullMQ. Se o SSE cair, o worker
   * continua processando e salva o resultado no banco normalmente.
   */
  @Public()
  @Sse(':id/resume/generate/stream')
  generateTailoredResumeStream(
    @Param('id') id: string,
    @Query('token') token: string,
    @Query('forceRegenerate') forceRegenerate?: string,
    @Query('language') language?: string,
  ): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      let isCleanedUp = false;
      let unsubscribeFn: (() => Promise<void>) | null = null;

      const emit = (event: string, data: unknown) => {
        if (!isCleanedUp && !subscriber.closed) {
          subscriber.next({ type: event, data: JSON.stringify(data) });
        }
      };

      const start = async () => {
        // 1. Validar token JWT
        let userId: string;
        try {
          const payload = this.jwtService.verify<{ sub: string }>(
            token ?? '',
            { secret: this.configService.get('jwtSecret', { infer: true }) },
          );
          userId = payload.sub;
        } catch {
          emit('error', { message: 'Token inválido ou expirado. Faça login novamente.' });
          subscriber.complete();
          return;
        }

        const isForce = forceRegenerate === 'true';

        // 2. Se já existe currículo completo e não pediu forceRegenerate, retornar imediatamente
        if (!isForce) {
          const existing = await this.tailoredResumesRepository.findByUserAndJob(userId, id);
          if (existing && existing.markdownContent && existing.pdfBase64) {
            emit('complete', { resume: existing });
            subscriber.complete();
            return;
          }
        }

        const channel = RESUME_PROGRESS_CHANNEL(userId, id);
        const jobKey = `resume:${userId}:${id}`;

        // 3. Inscrever no canal Redis Pub/Sub para ouvir os eventos do worker
        unsubscribeFn = await this.redisPubSub.subscribe(channel, (messageStr) => {
          try {
            const message = JSON.parse(messageStr) as {
              type: 'progress' | 'complete' | 'error';
              data: unknown;
            };

            if (message.type === 'progress') {
              emit('progress', message.data);
            } else if (message.type === 'complete') {
              emit('complete', message.data);
              subscriber.complete();
            } else if (message.type === 'error') {
              emit('error', message.data);
              subscriber.complete();
            }
          } catch {
            // Ignora JSON inválido do redis
          }
        });

        // 4. Enfileirar o job no BullMQ (se já estiver rodando, BullMQ desduplica pelo jobId)
        try {
          const existingJob = await this.resumeQueue.getJob(jobKey);
          const isJobActiveOrWaiting =
            existingJob &&
            (await existingJob.isActive() || await existingJob.isWaiting() || await existingJob.isDelayed());

          if (!isJobActiveOrWaiting || isForce) {
            if (existingJob && isForce) {
              try {
                await existingJob.remove();
              } catch {
                // Ignore se não puder remover
              }
            }

            await this.resumeQueue.add(
              RESUME_GENERATION_JOB,
              {
                userId,
                jobId: id,
                forceRegenerate: isForce,
                language: language === 'en' ? 'en' : 'pt-BR',
              },
              {
                jobId: isForce ? `${jobKey}:${Date.now()}` : jobKey,
                removeOnComplete: 100,
                removeOnFail: 100,
              },
            );
          }
        } catch (queueErr) {
          this.logger.error('Erro ao adicionar job na fila BullMQ:', queueErr);
          emit('error', { message: 'Erro ao iniciar o processamento na fila.' });
          subscriber.complete();
        }
      };

      void start();

      // Teardown: quando o cliente SSE desconecta, apenas desinscreve do Redis
      // O job na fila continua rodando independentemente!
      return () => {
        isCleanedUp = true;
        if (unsubscribeFn) {
          void unsubscribeFn();
        }
      };
    });
  }

  @AllowJwt()
  @RequireUser()
  @Post(':id/resume/generate')
  async generateTailoredResume(
    @Param('id') id: string,
    @Body() body: GenerateTailoredResumeDto,
    @CurrentAuth() auth: AuthContext,
  ) {
    if (auth.type !== 'jwt') {
      throw new UnauthorizedException('Authentication required');
    }

    const isForce = Boolean(body?.forceRegenerate);

    // Se já existe e não é force, retorna direto
    if (!isForce) {
      const existing = await this.tailoredResumesRepository.findByUserAndJob(auth.userId, id);
      if (existing && existing.markdownContent && existing.pdfBase64) {
        return { status: 'already_completed', resume: existing };
      }
    }

    const jobKey = `resume:${auth.userId}:${id}`;
    await this.resumeQueue.add(
      RESUME_GENERATION_JOB,
      {
        userId: auth.userId,
        jobId: id,
        forceRegenerate: isForce,
        language: body?.language,
      },
      {
        jobId: isForce ? `${jobKey}:${Date.now()}` : jobKey,
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    );

    return { jobKey, status: 'queued' };
  }

  @AllowJwt()
  @RequireUser()
  @Get(':id/resume')
  async getTailoredResume(
    @Param('id') id: string,
    @CurrentAuth() auth: AuthContext,
  ) {
    if (auth.type !== 'jwt') {
      throw new UnauthorizedException('Authentication required');
    }
    return this.getJobTailoredResumeUseCase.execute(auth.userId, id);
  }

  @AllowJwt()
  @RequireUser()
  @Get(':id/resume/pdf')
  async downloadTailoredResumePdf(
    @Param('id') id: string,
    @CurrentAuth() auth: AuthContext,
    @Res() res: Response,
  ) {
    if (auth.type !== 'jwt') {
      throw new UnauthorizedException('Authentication required');
    }
    const result = await this.downloadJobTailoredResumePdfUseCase.execute(
      auth.userId,
      id,
    );

    res.status(HttpStatus.OK);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${result.filename}"`,
    );
    res.setHeader('Content-Length', result.buffer.length);
    res.end(result.buffer);
  }
}
