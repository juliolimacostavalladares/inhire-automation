import { JobStatus } from '../enums';

export interface JobProps {
  id?: string;
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
  createdAt?: Date;
  updatedAt?: Date;
}

export class Job {
  private readonly _id?: string;
  private readonly _externalId: string;
  private readonly _tenantId: string;
  private _title: string;
  private _workplaceType?: string | null;
  private _location?: string | null;
  private _sourceStatus?: string | null;
  private _descriptionHtml?: string | null;
  private _applicationForm?: unknown;
  private _publishedAt?: Date | null;
  private _lastPublishedAt?: Date | null;
  private _detailFetchedAt?: Date | null;
  private _url: string;
  private _status: JobStatus;
  private _firstSeenAt: Date;
  private _lastSeenAt: Date;
  private _closedAt?: Date | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: JobProps) {
    this._id = props.id;
    this._externalId = props.externalId;
    this._tenantId = props.tenantId;
    this._title = (props.title || '').trim();
    if (!this._title) throw new Error('Título da vaga é obrigatório');
    this._workplaceType = props.workplaceType;
    this._location = props.location;
    this._sourceStatus = props.sourceStatus;
    this._descriptionHtml = props.descriptionHtml;
    this._applicationForm = props.applicationForm;
    this._publishedAt = props.publishedAt;
    this._lastPublishedAt = props.lastPublishedAt;
    this._detailFetchedAt = props.detailFetchedAt;
    this._url = props.url;
    this._status = props.status ?? JobStatus.PUBLISHED;
    this._firstSeenAt = props.firstSeenAt ?? new Date();
    this._lastSeenAt = props.lastSeenAt ?? new Date();
    this._closedAt = props.closedAt;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  get id(): string | undefined {
    return this._id;
  }
  get externalId(): string {
    return this._externalId;
  }
  get tenantId(): string {
    return this._tenantId;
  }
  get title(): string {
    return this._title;
  }
  get status(): JobStatus {
    return this._status;
  }
  get url(): string {
    return this._url;
  }

  close(): void {
    this._status = JobStatus.CLOSED;
    this._closedAt = new Date();
    this._updatedAt = new Date();
  }
}
