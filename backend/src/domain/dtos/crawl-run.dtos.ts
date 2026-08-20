import { RunStatus, RunTrigger, RunType } from '../enums';

export interface ICreateCrawlRunDTO {
  type: RunType;
  trigger: RunTrigger;
  totalItems?: number;
}

export interface ICrawlRunOutputDTO {
  id: string;
  type: RunType;
  trigger: RunTrigger;
  status: RunStatus;
  totalItems: number;
  processedItems: number;
  successItems: number;
  failedItems: number;
  discovered: number;
  jobsCreated: number;
  jobsUpdated: number;
  jobsClosed: number;
  error?: string | null;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  createdAt: Date;
}
