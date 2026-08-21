import { JobStatus } from '../enums';

export interface ICreateJobInputDTO {
  externalId: string;
  tenantId: string;
  title: string;
  workplaceType?: string | null;
  location?: string | null;
  sourceStatus?: string | null;
  descriptionHtml?: string | null;
  applicationForm?: unknown;
  publishedAt?: Date | null;
  lastPublishedAt?: Date | null;
  detailFetchedAt?: Date | null;
  url: string;
  status?: JobStatus;
  firstSeenAt?: Date;
  lastSeenAt?: Date;
  closedAt?: Date | null;
}

export interface IJobFilterDTO {
  tenantId?: string;
  tenantSlug?: string;
  status?: JobStatus;
  workplaceType?: string;
  location?: string;
  title?: string;
  area?: string;
  firstSeenFrom?: string;
  firstSeenTo?: string;
  publishedFrom?: string;
  publishedTo?: string;
  page: number;
  limit: number;
}

export interface IJobOutputDTO {
  id: string;
  externalId: string;
  tenantId: string;
  title: string;
  workplaceType?: string | null;
  location?: string | null;
  sourceStatus?: string | null;
  descriptionHtml?: string | null;
  applicationForm?: unknown;
  publishedAt?: Date | null;
  firstSeenAt: Date;
  lastSeenAt: Date;
  closedAt?: Date | null;
  url: string;
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;
  tenant?: {
    id: string;
    slug: string;
    name: string;
    logoUrl?: string | null;
  };
}
