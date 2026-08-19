import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { Prisma, TenantOrigin } from "@prisma/client";
import { paginationMeta } from "../common/pagination.dto";
import { InhireClientService } from "../inhire/inhire-client.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { QueryTenantsDto } from "./dto/query-tenants.dto";
import { UpdateTenantDto } from "./dto/update-tenant.dto";
import { slugVariants } from "./slug.util";

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inhire: InhireClientService,
  ) {}

  async list(query: QueryTenantsDto) {
    const where: Prisma.TenantWhereInput = {
      active: query.active,
      origin: query.origin,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { slug: { contains: query.search } },
            ],
          }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.tenant.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.tenant.count({ where }),
    ]);
    return { data, meta: paginationMeta(total, query.page, query.limit) };
  }

  async get(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { _count: { select: { jobs: true } } },
    });
    if (!tenant) throw new NotFoundException("Tenant not found");
    return tenant;
  }

  async create(dto: CreateTenantDto) {
    if (Boolean(dto.slug) === Boolean(dto.name)) {
      throw new BadRequestException("Provide exactly one of name or slug");
    }
    const candidates = dto.slug
      ? [dto.slug.toLowerCase()]
      : slugVariants(dto.name!);
    const matches: { slug: string; name: string }[] = [];
    for (const slug of candidates) {
      const result = await this.inhire.fetchTenant(slug);
      if (result)
        matches.push({ slug, name: result.tenantName || dto.name || slug });
    }
    const unique = [
      ...new Map(matches.map((match) => [match.slug, match])).values(),
    ];
    if (unique.length === 0)
      throw new UnprocessableEntityException("No valid InHire tenant found");
    if (unique.length > 1)
      throw new ConflictException({
        message: "Multiple tenants found",
        candidates: unique,
      });

    const match = unique[0];
    try {
      return await this.prisma.tenant.create({
        data: {
          slug: match.slug,
          name: match.name,
          origin: TenantOrigin.MANUAL,
          lastValidatedAt: new Date(),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Tenant already exists");
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.get(id);
    return this.prisma.tenant.update({ where: { id }, data: dto });
  }

  async deactivate(id: string) {
    await this.get(id);
    return this.prisma.tenant.update({
      where: { id },
      data: { active: false },
    });
  }
}
