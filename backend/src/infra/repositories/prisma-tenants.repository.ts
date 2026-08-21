import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ICreateTenantInputDTO,
  IPaginatedResult,
  ITenantOutputDTO,
  IUpdateTenantInputDTO,
} from '../../domain/dtos';
import { TenantOrigin } from '../../domain/enums';
import {
  IQueryTenantsParams,
  ITenantsRepository,
} from '../../app/repositories/tenants.repository.interface';
import { PrismaService } from '../databases/prisma/prisma.service';

@Injectable()
export class PrismaTenantsRepository implements ITenantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: ICreateTenantInputDTO): Promise<ITenantOutputDTO> {
    const tenant = await this.prisma.tenant.create({
      data: {
        slug: data.slug,
        name: data.name,
        logoUrl: data.logoUrl,
        origin: data.origin,
        active: data.active ?? true,
        lastValidatedAt: data.lastValidatedAt,
        lastCollectedAt: data.lastCollectedAt,
      },
    });
    return this.toOutputDTO(tenant);
  }

  async upsert(slug: string, data: ICreateTenantInputDTO): Promise<ITenantOutputDTO> {
    const tenant = await this.prisma.tenant.upsert({
      where: { slug },
      create: {
        slug: data.slug,
        name: data.name,
        logoUrl: data.logoUrl,
        origin: data.origin,
        active: data.active ?? true,
        lastValidatedAt: data.lastValidatedAt,
      },
      update: {
        name: data.name,
        ...(data.logoUrl ? { logoUrl: data.logoUrl } : {}),
        lastValidatedAt: data.lastValidatedAt ?? new Date(),
      },
    });
    return this.toOutputDTO(tenant);
  }

  async findById(id: string): Promise<ITenantOutputDTO | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { _count: { select: { jobs: true } } },
    });
    if (!tenant) return null;
    return {
      ...this.toOutputDTO(tenant),
      jobsCount: tenant._count?.jobs ?? 0,
    };
  }

  async findBySlug(slug: string): Promise<ITenantOutputDTO | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      include: { _count: { select: { jobs: true } } },
    });
    if (!tenant) return null;
    return {
      ...this.toOutputDTO(tenant),
      jobsCount: tenant._count?.jobs ?? 0,
    };
  }

  async findMany(params: IQueryTenantsParams): Promise<IPaginatedResult<ITenantOutputDTO>> {
    const where: Prisma.TenantWhereInput = {
      active: params.active,
      origin: params.origin,
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' } },
              { slug: { contains: params.search } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.tenant.findMany({
        where,
        include: { _count: { select: { jobs: true } } },
        orderBy: { name: 'asc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      data: data.map((t) => ({
        ...this.toOutputDTO(t),
        jobsCount: t._count?.jobs ?? 0,
      })),
      meta: {
        total,
        page: params.page,
        limit: params.limit,
        pages: Math.ceil(total / params.limit) || 1,
      },
    };
  }

  async update(id: string, data: IUpdateTenantInputDTO): Promise<ITenantOutputDTO> {
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
        ...(data.lastValidatedAt ? { lastValidatedAt: data.lastValidatedAt } : {}),
        ...(data.lastCollectedAt ? { lastCollectedAt: data.lastCollectedAt } : {}),
      },
    });
    return this.toOutputDTO(tenant);
  }

  private toOutputDTO(tenant: {
    id: string;
    slug: string;
    name: string;
    logoUrl?: string | null;
    origin: unknown;
    active: boolean;
    lastValidatedAt: Date | null;
    lastCollectedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): ITenantOutputDTO {
    return {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      logoUrl: tenant.logoUrl ?? null,
      origin: tenant.origin as TenantOrigin,
      active: tenant.active,
      lastValidatedAt: tenant.lastValidatedAt,
      lastCollectedAt: tenant.lastCollectedAt,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }
}
