import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  Sse,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
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
import { GenerateJobTailoredResumeUseCase, type ResumeProgressEvent } from '../../../app/useCases/candidateProfile/generate-job-tailored-resume.usecase';
import { GetJobTailoredResumeUseCase } from '../../../app/useCases/candidateProfile/get-job-tailored-resume.usecase';
import { DownloadJobTailoredResumePdfUseCase } from '../../../app/useCases/candidateProfile/download-job-tailored-resume-pdf.usecase';
import { enforceJobsListPolicy } from '../../../infra/utils/jobs-access';
import type { Environment } from '../../../infra/config/environment';

@Controller('jobs')
@UseGuards(ApiKeyGuard)
export class JobsController {
  constructor(
    private readonly listJobsUseCase: ListJobsUseCase,
    private readonly getJobDetailUseCase: GetJobDetailUseCase,
    private readonly getJobApplicationFormUseCase: GetJobApplicationFormUseCase,
    private readonly generateJobTailoredResumeUseCase: GenerateJobTailoredResumeUseCase,
    private readonly getJobTailoredResumeUseCase: GetJobTailoredResumeUseCase,
    private readonly downloadJobTailoredResumePdfUseCase: DownloadJobTailoredResumePdfUseCase,
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
   * SSE: Gera currículo ATS em tempo real com eventos de progresso.
   * Usar GET com ?token=JWT pois EventSource não suporta headers customizados.
   */
  @Public()
  @Sse(':id/resume/generate/stream')
  generateTailoredResumeStream(
    @Param('id') id: string,
    @Query('token') token: string,
    @Query('forceRegenerate') forceRegenerate?: string,
    @Query('language') language?: string,
  ): Observable<MessageEvent> {
    const subject = new Subject<MessageEvent>();

    const emit = (event: string, data: unknown) =>
      subject.next({ type: event, data: JSON.stringify(data) });

    const run = async () => {
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
        subject.complete();
        return;
      }

      // 2. Rodar o use case emitindo progresso
      try {
        const resume = await this.generateJobTailoredResumeUseCase.execute(
          {
            userId,
            jobId: id,
            forceRegenerate: forceRegenerate === 'true',
            language: language === 'en' ? 'en' : 'pt-BR',
          },
          (progress: ResumeProgressEvent) => {
            emit('progress', progress);
          },
        );
        emit('complete', { resume });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Erro inesperado ao gerar currículo.';
        emit('error', { message });
      } finally {
        subject.complete();
      }
    };

    void run();
    return subject.asObservable();
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
    return this.generateJobTailoredResumeUseCase.execute({
      userId: auth.userId,
      jobId: id,
      forceRegenerate: body?.forceRegenerate,
      language: body?.language,
    });
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
