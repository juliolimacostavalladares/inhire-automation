import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ITenantOutputDTO } from '../../../domain/dtos';
import {
  ITenantsRepository,
  TENANTS_REPOSITORY_TOKEN,
} from '../../repositories/tenants.repository.interface';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class GetTenantUseCase {
  constructor(
    @Inject(TENANTS_REPOSITORY_TOKEN)
    private readonly tenantsRepository: ITenantsRepository,
  ) {}

  async execute(idOrSlug: string): Promise<ITenantOutputDTO> {
    let tenant: ITenantOutputDTO | null = null;

    if (UUID_REGEX.test(idOrSlug)) {
      tenant = await this.tenantsRepository.findById(idOrSlug);
    }

    if (!tenant) {
      tenant = await this.tenantsRepository.findBySlug(idOrSlug);
    }

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }
}
