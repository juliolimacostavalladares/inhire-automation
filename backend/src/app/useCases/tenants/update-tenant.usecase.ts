import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ITenantOutputDTO, IUpdateTenantInputDTO } from '../../../domain/dtos';
import {
  ITenantsRepository,
  TENANTS_REPOSITORY_TOKEN,
} from '../../repositories/tenants.repository.interface';

@Injectable()
export class UpdateTenantUseCase {
  constructor(
    @Inject(TENANTS_REPOSITORY_TOKEN)
    private readonly tenantsRepository: ITenantsRepository,
  ) {}

  async execute(id: string, dto: IUpdateTenantInputDTO): Promise<ITenantOutputDTO> {
    const existing = await this.tenantsRepository.findById(id);
    if (!existing) throw new NotFoundException('Tenant not found');
    return this.tenantsRepository.update(id, dto);
  }
}
