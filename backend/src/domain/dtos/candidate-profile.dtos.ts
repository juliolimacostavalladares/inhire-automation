import {
  CandidateProfileSource,
  CandidateProfileStatus,
} from '../enums';

export interface IExperienceEntryDTO {
  company: string;
  title: string | null;
  startMonth?: string | null;
  startYear?: string | null;
  endMonth?: string | null;
  endYear?: string | null;
  ongoing?: boolean;
  location?: string | null;
  description?: string | null;
}

export interface IEducationEntryDTO {
  school: string;
  degree?: string | null;
  field?: string | null;
  startMonth?: string | null;
  startYear?: string | null;
  endMonth?: string | null;
  endYear?: string | null;
  ongoing?: boolean;
}

export interface IExtractedCandidateProfileDTO {
  fullName?: string | null;
  professionalTitle?: string | null;
  professionalArea?: string | null;
  seniority?: string | null;
  phone?: string | null;
  location?: string | null;
  summary?: string | null;
  skills: string[];
  experiences: IExperienceEntryDTO[];
  education: IEducationEntryDTO[];
}

export interface ICandidateProfileAnalysisDTO {
  seniority: string;
  headline: string;
  summary: string;
  coreCompetencies: string[];
  strengths: string[];
  recommendations: string[];
  targetRoles: string[];
  searchKeywords: string[];
}

export interface ICandidateProfileInputDTO {
  userId: string;
  status?: CandidateProfileStatus;
  source?: CandidateProfileSource;
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
  experiences?: IExperienceEntryDTO[] | unknown[] | null;
  education?: IEducationEntryDTO[] | unknown[] | null;
  alertsEnabled?: boolean;
  sourceFileName?: string | null;
  sourceFileMime?: string | null;
  sourceFileSize?: number | null;
  extractedText?: string | null;
  sourceImportedAt?: Date | null;
  reviewedAt?: Date | null;
}

export interface ICandidateProfileOutputDTO extends ICandidateProfileInputDTO {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
