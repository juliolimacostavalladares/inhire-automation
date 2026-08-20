export interface ITailoredResumeOutputDTO {
  id: string;
  userId: string;
  jobId: string;
  targetRole: string;
  markdownContent: string;
  pdfBase64?: string | null;
  matchScore?: number | null;
  summary?: string | null;
  highlightedKeywords?: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITailoredResumeInputDTO {
  userId: string;
  jobId: string;
  targetRole: string;
  markdownContent: string;
  pdfBase64?: string | null;
  matchScore?: number | null;
  summary?: string | null;
  highlightedKeywords?: string[] | null;
}

export interface IGenerateTailoredResumeDTO {
  jobId: string;
  userId: string;
  forceRegenerate?: boolean;
  language?: 'pt-BR' | 'en';
}

export interface ITailoredResumeAiResponse {
  targetRole: string;
  markdown: string;
  matchScore: number;
  summary: string;
  highlightedKeywords: string[];
}
