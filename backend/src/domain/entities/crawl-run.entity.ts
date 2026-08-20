import { RunStatus, RunTrigger, RunType } from '../enums';

export interface CrawlRunProps {
  id?: string;
  type: RunType;
  trigger: RunTrigger;
  status?: RunStatus;
  totalItems?: number;
  processedItems?: number;
  successItems?: number;
  failedItems?: number;
  discovered?: number;
  jobsCreated?: number;
  jobsUpdated?: number;
  jobsClosed?: number;
  error?: string | null;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  createdAt?: Date;
}

export class CrawlRun {
  private readonly _id?: string;
  private readonly _type: RunType;
  private readonly _trigger: RunTrigger;
  private _status: RunStatus;
  private _totalItems: number;
  private _processedItems: number;
  private _successItems: number;
  private _failedItems: number;
  private _discovered: number;
  private _jobsCreated: number;
  private _jobsUpdated: number;
  private _jobsClosed: number;
  private _error?: string | null;
  private _startedAt?: Date | null;
  private _finishedAt?: Date | null;
  private readonly _createdAt: Date;

  constructor(props: CrawlRunProps) {
    this._id = props.id;
    this._type = props.type;
    this._trigger = props.trigger;
    this._status = props.status ?? RunStatus.QUEUED;
    this._totalItems = props.totalItems ?? 0;
    this._processedItems = props.processedItems ?? 0;
    this._successItems = props.successItems ?? 0;
    this._failedItems = props.failedItems ?? 0;
    this._discovered = props.discovered ?? 0;
    this._jobsCreated = props.jobsCreated ?? 0;
    this._jobsUpdated = props.jobsUpdated ?? 0;
    this._jobsClosed = props.jobsClosed ?? 0;
    this._error = props.error;
    this._startedAt = props.startedAt;
    this._finishedAt = props.finishedAt;
    this._createdAt = props.createdAt ?? new Date();
  }

  get id(): string | undefined {
    return this._id;
  }
  get status(): RunStatus {
    return this._status;
  }
}
