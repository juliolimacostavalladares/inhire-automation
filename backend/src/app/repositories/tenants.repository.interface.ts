import {
  ICreateTenantInputDTO,
  IPaginatedResult,
  ITenantOutputDTO,
  IUpdateTenantInputDTO,
} from '../../domain/dtos';
import { TenantOrigin } from '../../domain/enums';

export const TENANTS_REPOSITORY_TOKEN = Symbol('TENANTS_REPOSITORY_TOKEN');

export interface IQueryTenantsParams {
  page: number;
  limit: number;
  active?: boolean;
  origin?: TenantOrigin;
  search?: string;
}

export interface ITenantsRepository {
  create(data: ICreateTenantInputDTO): Promise<ITenantOutputDTO>;
  upsert(slug: string, data: ICreateTenantInputDTO): Promise<ITenantOutputDTO>;
  findById(id: string): Promise<ITenantOutputDTO | null>;
  findBySlug(slug: string): Promise<ITenantOutputDTO | null>;
  findMany(params: IQueryTenantsParams): Promise<IPaginatedResult<ITenantOutputDTO>>;
  update(id: string, data: IUpdateTenantInputDTO): Promise<ITenantOutputDTO>;
}
