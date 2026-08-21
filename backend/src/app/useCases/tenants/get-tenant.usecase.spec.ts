import { NotFoundException } from '@nestjs/common';
import { GetTenantUseCase } from './get-tenant.usecase';
import type { ITenantsRepository } from '../../repositories/tenants.repository.interface';
import { TenantOrigin } from '../../../domain/enums';
import type { ITenantOutputDTO } from '../../../domain/dtos';

describe('GetTenantUseCase', () => {
  let useCase: GetTenantUseCase;
  let findByIdMock: jest.Mock;
  let findBySlugMock: jest.Mock;

  const mockTenant: ITenantOutputDTO = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    slug: 'asa',
    name: 'Asa',
    logoUrl: 'https://example.com/logo.png',
    origin: TenantOrigin.MANUAL,
    active: true,
    lastValidatedAt: null,
    lastCollectedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    jobsCount: 5,
  };

  beforeEach(() => {
    findByIdMock = jest.fn();
    findBySlugMock = jest.fn();

    const mockRepository: ITenantsRepository = {
      findById: findByIdMock,
      findBySlug: findBySlugMock,
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    };
    useCase = new GetTenantUseCase(mockRepository);
  });

  it('should find tenant by valid UUID', async () => {
    findByIdMock.mockResolvedValue(mockTenant);

    const result = await useCase.execute('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

    expect(findByIdMock).toHaveBeenCalledWith('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    expect(findBySlugMock).not.toHaveBeenCalled();
    expect(result).toEqual(mockTenant);
  });

  it('should find tenant by slug when idOrSlug is not a UUID', async () => {
    findBySlugMock.mockResolvedValue(mockTenant);

    const result = await useCase.execute('asa');

    expect(findByIdMock).not.toHaveBeenCalled();
    expect(findBySlugMock).toHaveBeenCalledWith('asa');
    expect(result).toEqual(mockTenant);
  });

  it('should throw NotFoundException when tenant is not found', async () => {
    findBySlugMock.mockResolvedValue(null);

    await expect(useCase.execute('non-existent')).rejects.toThrow(NotFoundException);
  });
});
