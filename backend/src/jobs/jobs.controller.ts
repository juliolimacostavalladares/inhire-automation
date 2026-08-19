import { Controller, Get, Param, ParseUUIDPipe, Query, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { AllowJwt, Public } from "../common/api-key.guard";
import type { AuthenticatedRequest } from "../common/auth-context";
import { QueryJobsDto } from "./dto/query-jobs.dto";
import { JobsService } from "./jobs.service";

@ApiTags("jobs")
@Controller("jobs")
@AllowJwt()
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  @Public()
  @Throttle({ default: { limit: 5, ttl: 1_000 } })
  list(@Query() query: QueryJobsDto, @Req() request: AuthenticatedRequest) {
    return this.jobs.list(query, request.auth);
  }

  @Get(":id")
  get(@Param("id", ParseUUIDPipe) id: string) {
    return this.jobs.get(id);
  }

  @Get(":id/application-form")
  applicationForm(@Param("id", ParseUUIDPipe) id: string) {
    return this.jobs.getApplicationForm(id);
  }
}
