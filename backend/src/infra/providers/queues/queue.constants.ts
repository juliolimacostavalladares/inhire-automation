export const COLLECTION_QUEUE = "inhire-collection";
export const DISCOVERY_QUEUE = "tenant-discovery";
export const COLLECTION_JOB = "collect-published-jobs";
export const DISCOVERY_JOB = "discover-tenants";
export const RESUME_GENERATION_QUEUE = 'resume-generation';
export const RESUME_GENERATION_JOB = 'generate-tailored-resume';
export const RESUME_PROGRESS_CHANNEL = (userId: string, jobId: string) =>
  `resume-progress:${userId}:${jobId}`;
