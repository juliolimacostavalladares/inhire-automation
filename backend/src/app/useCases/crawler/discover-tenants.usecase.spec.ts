import { DiscoverTenantsUseCase } from './discover-tenants.usecase';
import { TenantOrigin } from '../../../domain/enums';
import type { PrismaService } from '../../../infra/databases/prisma/prisma.service';
import type { DiscoverySourceService } from '../../../infra/services/crawler/discovery-source.service';
import type { InhireClientService } from '../../../infra/providers/inhire/inhire-client.service';

describe('DiscoverTenantsUseCase', () => {
  let useCase: DiscoverTenantsUseCase;
  let prismaMock: {
    crawlRunItem: { create: jest.Mock; update: jest.Mock };
    tenant: { findUnique: jest.Mock; upsert: jest.Mock; update: jest.Mock };
    discoveryEvidence: { createMany: jest.Mock };
  };
  let sourcesMock: { collectAll: jest.Mock };
  let inhireMock: { fetchTenant: jest.Mock };

  beforeEach(() => {
    prismaMock = {
      crawlRunItem: {
        create: jest.fn().mockResolvedValue({ id: 'item-1' }),
        update: jest.fn().mockResolvedValue({}),
      },
      tenant: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({ id: 'tenant-1', slug: 'empresa-ativa' }),
        update: jest.fn().mockResolvedValue({}),
      },
      discoveryEvidence: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    sourcesMock = {
      collectAll: jest.fn(),
    };
    inhireMock = {
      fetchTenant: jest.fn(),
    };

    useCase = new DiscoverTenantsUseCase(
      prismaMock as unknown as PrismaService,
      sourcesMock as unknown as DiscoverySourceService,
      inhireMock as unknown as InhireClientService,
    );
  });

  it('should save tenant when it has open published jobs', async () => {
    inhireMock.fetchTenant.mockResolvedValue({
      tenantName: 'Empresa Ativa',
      logo: 'https://logo.png',
      jobsPage: [
        { jobId: 'job-1', displayName: 'Dev Front-end', status: 'published' },
      ],
    });

    const result = await useCase.validateAndSaveCandidates('run-1', [
      ['empresa-ativa', [{ source: TenantOrigin.WAYBACK }]],
    ]);

    expect(result.discoveredTenantIds).toEqual(['tenant-1']);
    expect(result.success).toBe(1);
    expect(prismaMock.tenant.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: 'empresa-ativa' },
        create: expect.objectContaining({ active: true }),
      }),
    );
  });

  it('should NOT save tenant when it has 0 open jobs', async () => {
    inhireMock.fetchTenant.mockResolvedValue({
      tenantName: 'Empresa Sem Vagas',
      logo: 'https://logo.png',
      jobsPage: [],
    });

    const result = await useCase.validateAndSaveCandidates('run-1', [
      ['empresa-sem-vagas', [{ source: TenantOrigin.WAYBACK }]],
    ]);

    expect(result.discoveredTenantIds).toEqual([]);
    expect(result.success).toBe(1);
    expect(prismaMock.tenant.upsert).not.toHaveBeenCalled();
    expect(prismaMock.crawlRunItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'item-1' },
        data: { status: 'SUCCEEDED' },
      }),
    );
  });
});
