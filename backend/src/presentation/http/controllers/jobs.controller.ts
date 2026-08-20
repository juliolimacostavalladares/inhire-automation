import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AllowJwt, ApiKeyGuard, Public, RequireUser } from '../guards/api-key.guard';
import { CurrentAuth, type AuthContext } from '../guards/auth-context';
import { QueryJobsDto } from '../dto/query-jobs.dto';
import { GenerateTailoredResumeDto } from '../dto/tailored-resume.dto';
import { ListJobsUseCase } from '../../../app/useCases/jobs/list-jobs.usecase';
import { GetJobDetailUseCase } from '../../../app/useCases/jobs/get-job-detail.usecase';
import { GetJobApplicationFormUseCase } from '../../../app/useCases/jobs/get-job-application-form.usecase';
import { GenerateJobTailoredResumeUseCase } from '../../../app/useCases/candidateProfile/generate-job-tailored-resume.usecase';
import { GetJobTailoredResumeUseCase } from '../../../app/useCases/candidateProfile/get-job-tailored-resume.usecase';
import { DownloadJobTailoredResumePdfUseCase } from '../../../app/useCases/candidateProfile/download-job-tailored-resume-pdf.usecase';
import { enforceJobsListPolicy } from '../../../infra/utils/jobs-access';

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
