import { Inject, Injectable } from '@nestjs/common';
import { IPaginatedResult, ITenantOutputDTO } from '../../../domain/dtos';
import {
  IQueryTenantsParams,
  ITenantsRepository,
  TENANTS_REPOSITORY_TOKEN,
} from '../../repositories/tenants.repository.interface';

@Injectable()
export class ListTenantsUseCase {
  constructor(
    @Inject(TENANTS_REPOSITORY_TOKEN)
    private readonly tenantsRepository: ITenantsRepository,
  ) {}

  async execute(params: IQueryTenantsParams): Promise<IPaginatedResult<ITenantOutputDTO>> {
    return this.tenantsRepository.findMany(params);
  }
}
