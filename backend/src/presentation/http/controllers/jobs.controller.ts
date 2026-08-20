import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiKeyGuard, Public } from '../guards/api-key.guard';
import { CurrentAuth, type AuthContext } from '../guards/auth-context';
import { QueryJobsDto } from '../dto/query-jobs.dto';
import { ListJobsUseCase } from '../../../app/useCases/jobs/list-jobs.usecase';
import { GetJobDetailUseCase } from '../../../app/useCases/jobs/get-job-detail.usecase';
import { GetJobApplicationFormUseCase } from '../../../app/useCases/jobs/get-job-application-form.usecase';
import { enforceJobsListPolicy } from '../../../infra/utils/jobs-access';

@Controller('jobs')
@UseGuards(ApiKeyGuard)
export class JobsController {
  constructor(
    private readonly listJobsUseCase: ListJobsUseCase,
    private readonly getJobDetailUseCase: GetJobDetailUseCase,
    private readonly getJobApplicationFormUseCase: GetJobApplicationFormUseCase,
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
}
