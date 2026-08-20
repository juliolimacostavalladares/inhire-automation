import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ITenantOutputDTO } from '../../../domain/dtos';
import {
  ITenantsRepository,
  TENANTS_REPOSITORY_TOKEN,
} from '../../repositories/tenants.repository.interface';

@Injectable()
export class GetTenantUseCase {
  constructor(
    @Inject(TENANTS_REPOSITORY_TOKEN)
    private readonly tenantsRepository: ITenantsRepository,
  ) {}

  async execute(id: string): Promise<ITenantOutputDTO> {
    const tenant = await this.tenantsRepository.findById(id);
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }
}
