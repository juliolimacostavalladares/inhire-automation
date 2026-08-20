import { TenantOrigin } from '../enums';

export interface ICreateTenantInputDTO {
  slug: string;
  name: string;
  logoUrl?: string | null;
  origin: TenantOrigin;
  active?: boolean;
  lastValidatedAt?: Date | null;
  lastCollectedAt?: Date | null;
}

export interface IUpdateTenantInputDTO {
  name?: string;
  logoUrl?: string | null;
  active?: boolean;
  lastValidatedAt?: Date | null;
  lastCollectedAt?: Date | null;
}

export interface ITenantOutputDTO {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string | null;
  origin: TenantOrigin;
  active: boolean;
  lastValidatedAt?: Date | null;
  lastCollectedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  jobsCount?: number;
}
