import { InjectQueue } from "@nestjs/bullmq";
import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Queue } from "bullmq";
import { Public } from "../common/api-key.guard";
import { PrismaService } from "../prisma/prisma.service";
import { COLLECTION_QUEUE } from "../queues/queue.constants";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(COLLECTION_QUEUE) private readonly queue: Queue,
  ) {}

  @Get()
  @Public()
  async check() {
    try {
      await Promise.all([
        this.prisma.$queryRaw`SELECT 1`,
        this.queue.getJobCounts("waiting"),
      ]);
      return { status: "ok", database: "up", redis: "up" };
    } catch {
      throw new ServiceUnavailableException({
        status: "error",
        message: "Dependency unavailable",
      });
    }
  }
}
