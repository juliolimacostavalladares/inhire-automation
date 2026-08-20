import { CandidateProfileSource, CandidateProfileStatus } from '../enums';

export interface CandidateProfileProps {
  id?: string;
  userId: string;
  status?: CandidateProfileStatus;
  source?: CandidateProfileSource | null;
  linkedinProfileUrl?: string | null;
  phone?: string | null;
  professionalTitle?: string | null;
  professionalArea?: string | null;
  seniority?: string | null;
  location?: string | null;
  country?: string | null;
  workModalities?: string[] | null;
  contractTypes?: string[] | null;
  salaryExpectation?: string | null;
  skills?: string[] | null;
  summary?: string | null;
  experiences?: unknown[] | null;
  education?: unknown[] | null;
  alertsEnabled?: boolean;
  sourceFileName?: string | null;
  sourceFileMime?: string | null;
  sourceFileSize?: number | null;
  extractedText?: string | null;
  sourceImportedAt?: Date | null;
  reviewedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CandidateProfile {
  private readonly _id?: string;
  private readonly _userId: string;
  private _status: CandidateProfileStatus;
  private _source?: CandidateProfileSource | null;
  private _linkedinProfileUrl?: string | null;
  private _phone?: string | null;
  private _professionalTitle?: string | null;
  private _professionalArea?: string | null;
  private _seniority?: string | null;
  private _location?: string | null;
  private _country?: string | null;
  private _workModalities?: string[] | null;
  private _contractTypes?: string[] | null;
  private _salaryExpectation?: string | null;
  private _skills?: string[] | null;
  private _summary?: string | null;
  private _experiences?: unknown[] | null;
  private _education?: unknown[] | null;
  private _alertsEnabled: boolean;
  private _sourceFileName?: string | null;
  private _sourceFileMime?: string | null;
  private _sourceFileSize?: number | null;
  private _extractedText?: string | null;
  private _sourceImportedAt?: Date | null;
  private _reviewedAt?: Date | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: CandidateProfileProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._status = props.status ?? CandidateProfileStatus.PENDING_IMPORT;
    this._source = props.source;
    this._linkedinProfileUrl = props.linkedinProfileUrl;
    this._phone = props.phone;
    this._professionalTitle = props.professionalTitle;
    this._professionalArea = props.professionalArea;
    this._seniority = props.seniority;
    this._location = props.location;
    this._country = props.country;
    this._workModalities = props.workModalities;
    this._contractTypes = props.contractTypes;
    this._salaryExpectation = props.salaryExpectation;
    this._skills = props.skills;
    this._summary = props.summary;
    this._experiences = props.experiences;
    this._education = props.education;
    this._alertsEnabled = props.alertsEnabled ?? true;
    this._sourceFileName = props.sourceFileName;
    this._sourceFileMime = props.sourceFileMime;
    this._sourceFileSize = props.sourceFileSize;
    this._extractedText = props.extractedText;
    this._sourceImportedAt = props.sourceImportedAt;
    this._reviewedAt = props.reviewedAt;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  get id(): string | undefined {
    return this._id;
  }
  get userId(): string {
    return this._userId;
  }
  get status(): CandidateProfileStatus {
    return this._status;
  }
  get source(): CandidateProfileSource | null | undefined {
    return this._source;
  }
  get professionalTitle(): string | null | undefined {
    return this._professionalTitle;
  }
  get skills(): string[] | null | undefined {
    return this._skills;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  markAsReviewed(): void {
    this._status = CandidateProfileStatus.COMPLETE;
    this._reviewedAt = new Date();
    this._updatedAt = new Date();
  }
}
