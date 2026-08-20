export type InhireJob = {
  jobId: string;
  displayName: string;
  workplaceType?: string;
  location?: string;
  status?: string;
};

export type InhireTenantPage = {
  tenantName: string;
  logo?: string;
  about?: string;
  jobsPage: InhireJob[];
};

export type InhireJobDetail = InhireJob & {
  logo?: string;
  about?: string;
  description?: string;
  publishedAt?: string;
  lastPublishedAt?: string;
  updatedAt?: string;
  contractType?: string[];
  privacyPolicyUrl?: string;
  settings?: {
    fields?: string[];
    requiredFields?: string[];
  };
  diversity?: {
    introduction?: string;
    questions?: InhireDiversityQuestion[];
  };
};

export type InhireDiversityQuestion = {
  id: string;
  title?: string;
  question?: string;
  description?: string;
  subTitle?: string;
  placeholder?: string;
  answerType?: string;
  required?: boolean;
  active?: boolean;
  diversityGroup?: string;
  isSubQuestionOf?: string;
  order?: number;
  answerOptions?: Array<{
    id: string;
    title?: string;
    description?: string;
    order?: number;
    subQuestionIds?: string[];
  }>;
};
