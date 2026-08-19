import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ApiAcceptedResponse, ApiTags } from "@nestjs/swagger";
import { RunType } from "@prisma/client";
import { QueryRunsDto } from "./dto/query-runs.dto";
import { RunsService } from "./runs.service";
import { AllowJwt, RequireAdmin } from "../common/api-key.guard";

@ApiTags("runs")
@Controller("runs")
@AllowJwt()
@RequireAdmin()
export class RunsController {
  constructor(private readonly runs: RunsService) {}

  @Post("collection")
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiAcceptedResponse({ description: "Collection queued" })
  collect() {
    return this.runs.enqueue(RunType.COLLECTION);
  }

  @Post("discovery")
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 2, ttl: 60_000 } })
  @ApiAcceptedResponse({ description: "Discovery queued" })
  discover() {
    return this.runs.enqueue(RunType.DISCOVERY);
  }

  @Get()
  list(@Query() query: QueryRunsDto) {
    return this.runs.list(query);
  }

  @Get(":id")
  get(@Param("id", ParseUUIDPipe) id: string) {
    return this.runs.get(id);
  }
}
