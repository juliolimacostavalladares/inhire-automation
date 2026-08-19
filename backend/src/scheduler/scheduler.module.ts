import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { RunsModule } from "../runs/runs.module";
import { SchedulerService } from "./scheduler.service";

@Module({
  imports: [ScheduleModule.forRoot(), RunsModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
