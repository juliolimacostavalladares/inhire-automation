import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { RunTrigger, RunType } from "@prisma/client";
import { RunsService } from "../runs/runs.service";

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly runs: RunsService) {}

  @Cron(CronExpression.EVERY_HOUR, { timeZone: "America/Sao_Paulo" })
  async collectHourly() {
    this.logger.log("Enqueueing scheduled hourly collection");
    await this.runs.enqueue(RunType.COLLECTION, RunTrigger.SCHEDULED, true);
  }

  @Cron("0 3 * * *", { timeZone: "America/Sao_Paulo" })
  async discoverDaily() {
    this.logger.log("Enqueueing scheduled tenant discovery");
    await this.runs.enqueue(RunType.DISCOVERY, RunTrigger.SCHEDULED, true);
  }
}
