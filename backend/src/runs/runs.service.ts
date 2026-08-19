import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, NotFoundException } from "@nestjs/common";
import { RunTrigger, RunType } from "@prisma/client";
import { Queue } from "bullmq";
import { paginationMeta } from "../common/pagination.dto";
import { PrismaService } from "../prisma/prisma.service";
import {
  COLLECTION_JOB,
  COLLECTION_QUEUE,
  DISCOVERY_JOB,
  DISCOVERY_QUEUE,
} from "../queues/queue.constants";
import { QueryRunsDto } from "./dto/query-runs.dto";

@Injectable()
export class RunsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(COLLECTION_QUEUE) private readonly collectionQueue: Queue,
    @InjectQueue(DISCOVERY_QUEUE) private readonly discoveryQueue: Queue,
  ) {}

  async enqueue(
    type: RunType,
    trigger: RunTrigger = RunTrigger.MANUAL,
    skipIfPending = true,
  ) {
    if (skipIfPending) {
      const pending = await this.prisma.crawlRun.findFirst({
        where: { type, status: { in: ["QUEUED", "RUNNING"] } },
        orderBy: { createdAt: "desc" },
      });
      if (pending) return pending;
    }
    const run = await this.prisma.crawlRun.create({ data: { type, trigger } });
    const queue =
      type === RunType.COLLECTION ? this.collectionQueue : this.discoveryQueue;
    const name = type === RunType.COLLECTION ? COLLECTION_JOB : DISCOVERY_JOB;
    try {
      await queue.add(
        name,
        { runId: run.id },
        { attempts: 3, backoff: { type: "exponential", delay: 1_000 } },
      );
      return run;
    } catch (error) {
      await this.prisma.crawlRun.update({
        where: { id: run.id },
        data: {
          status: "FAILED",
          error: "Unable to enqueue run",
          finishedAt: new Date(),
        },
      });
      throw error;
    }
  }

  async list(query: QueryRunsDto) {
    const where = { type: query.type, status: query.status };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.crawlRun.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.crawlRun.count({ where }),
    ]);
    return { data, meta: paginationMeta(total, query.page, query.limit) };
  }

  async get(id: string) {
    const run = await this.prisma.crawlRun.findUnique({
      where: { id },
      include: { items: { orderBy: { createdAt: "asc" } } },
    });
    if (!run) throw new NotFoundException("Run not found");
    return run;
  }
}
