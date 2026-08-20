CREATE TYPE "CandidateProfileStatus" AS ENUM ('PENDING_IMPORT', 'PROCESSING', 'NEEDS_REVIEW', 'COMPLETE', 'FAILED');

CREATE TYPE "CandidateProfileSource" AS ENUM ('LINKEDIN_PDF_UPLOAD', 'RESUME_UPLOAD', 'MANUAL');

CREATE TABLE "CandidateProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "CandidateProfileStatus" NOT NULL DEFAULT 'PENDING_IMPORT',
    "source" "CandidateProfileSource",
    "linkedinProfileUrl" VARCHAR(500),
    "phone" VARCHAR(40),
    "professionalTitle" VARCHAR(180),
    "professionalArea" VARCHAR(180),
    "seniority" VARCHAR(80),
    "location" VARCHAR(180),
    "country" VARCHAR(100),
    "workModalities" JSONB,
    "contractTypes" JSONB,
    "salaryExpectation" VARCHAR(100),
    "skills" JSONB,
    "summary" TEXT,
    "experiences" JSONB,
    "education" JSONB,
    "alertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sourceFileName" VARCHAR(255),
    "sourceFileMime" VARCHAR(100),
    "sourceFileSize" INTEGER,
    "extractedText" TEXT,
    "sourceImportedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CandidateProfile_userId_key" ON "CandidateProfile"("userId");
CREATE INDEX "CandidateProfile_status_idx" ON "CandidateProfile"("status");

ALTER TABLE "CandidateProfile" ADD CONSTRAINT "CandidateProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
