import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { paginationMeta } from "../common/pagination.dto";
import { PrismaService } from "../prisma/prisma.service";
import { QueryJobsDto } from "./dto/query-jobs.dto";
import type { AuthContext } from "../common/auth-context";
import { enforceJobsListPolicy } from "./jobs-access";

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QueryJobsDto, auth?: AuthContext) {
    enforceJobsListPolicy(query, auth);
    const where: Prisma.JobWhereInput = {
      tenantId: query.tenantId,
      status: query.status,
      workplaceType: query.workplaceType
        ? { contains: query.workplaceType, mode: "insensitive" }
        : undefined,
      location: query.location
        ? { contains: query.location, mode: "insensitive" }
        : undefined,
      title: query.title
        ? { contains: query.title, mode: "insensitive" }
        : undefined,
      firstSeenAt:
        query.firstSeenFrom || query.firstSeenTo
          ? {
              gte: query.firstSeenFrom
                ? new Date(query.firstSeenFrom)
                : undefined,
              lte: query.firstSeenTo ? new Date(query.firstSeenTo) : undefined,
            }
          : undefined,
      publishedAt:
        query.publishedFrom || query.publishedTo
          ? {
              gte: query.publishedFrom
                ? new Date(query.publishedFrom)
                : undefined,
              lte: query.publishedTo ? new Date(query.publishedTo) : undefined,
            }
          : undefined,
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where,
        select: {
          id: true,
          externalId: true,
          tenantId: true,
          title: true,
          workplaceType: true,
          location: true,
          sourceStatus: true,
          url: true,
          status: true,
          publishedAt: true,
          firstSeenAt: true,
          lastSeenAt: true,
          closedAt: true,
          tenant: { select: { id: true, slug: true, name: true } },
        },
        orderBy: [{ firstSeenAt: "desc" }, { id: "desc" }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.job.count({ where }),
    ]);
    return { data, meta: paginationMeta(total, query.page, query.limit) };
  }

  async get(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: { tenant: true },
    });
    if (!job) throw new NotFoundException("Job not found");
    return job;
  }

  async getApplicationForm(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      select: {
        id: true,
        externalId: true,
        title: true,
        url: true,
        detailFetchedAt: true,
        applicationForm: true,
        tenant: { select: { id: true, slug: true, name: true } },
      },
    });
    if (!job) throw new NotFoundException("Job not found");
    if (!job.applicationForm) {
      throw new NotFoundException(
        "Application form has not been synchronized yet",
      );
    }
    return job;
  }
}
