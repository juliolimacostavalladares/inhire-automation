CREATE TYPE "TenantOrigin" AS ENUM ('MANUAL', 'WAYBACK', 'URLSCAN', 'COMMON_CRAWL');
CREATE TYPE "JobStatus" AS ENUM ('PUBLISHED', 'CLOSED');
CREATE TYPE "RunType" AS ENUM ('COLLECTION', 'DISCOVERY');
CREATE TYPE "RunTrigger" AS ENUM ('SCHEDULED', 'MANUAL', 'DISCOVERY');
CREATE TYPE "RunStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'PARTIAL', 'FAILED');
CREATE TYPE "RunItemStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

CREATE TABLE "Tenant" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "origin" "TenantOrigin" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastValidatedAt" TIMESTAMP(3),
    "lastCollectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Job" (
    "id" UUID NOT NULL,
    "externalId" VARCHAR(100) NOT NULL,
    "tenantId" UUID NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "workplaceType" VARCHAR(100),
    "location" VARCHAR(500),
    "sourceStatus" VARCHAR(100),
    "url" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PUBLISHED',
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrawlRun" (
    "id" UUID NOT NULL,
    "type" "RunType" NOT NULL,
    "trigger" "RunTrigger" NOT NULL,
    "status" "RunStatus" NOT NULL DEFAULT 'QUEUED',
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "processedItems" INTEGER NOT NULL DEFAULT 0,
    "successItems" INTEGER NOT NULL DEFAULT 0,
    "failedItems" INTEGER NOT NULL DEFAULT 0,
    "discovered" INTEGER NOT NULL DEFAULT 0,
    "jobsCreated" INTEGER NOT NULL DEFAULT 0,
    "jobsUpdated" INTEGER NOT NULL DEFAULT 0,
    "jobsClosed" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrawlRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrawlRunItem" (
    "id" UUID NOT NULL,
    "runId" UUID NOT NULL,
    "tenantId" UUID,
    "subject" VARCHAR(500) NOT NULL,
    "status" "RunItemStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CrawlRunItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DiscoveryEvidence" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "source" "TenantOrigin" NOT NULL,
    "evidenceUrl" TEXT NOT NULL,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiscoveryEvidence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");
CREATE INDEX "Tenant_active_idx" ON "Tenant"("active");
CREATE INDEX "Tenant_name_idx" ON "Tenant"("name");
CREATE INDEX "Job_status_lastSeenAt_idx" ON "Job"("status", "lastSeenAt");
CREATE INDEX "Job_tenantId_status_idx" ON "Job"("tenantId", "status");
CREATE INDEX "Job_title_idx" ON "Job"("title");
CREATE UNIQUE INDEX "Job_tenantId_externalId_key" ON "Job"("tenantId", "externalId");
CREATE INDEX "CrawlRun_type_createdAt_idx" ON "CrawlRun"("type", "createdAt");
CREATE INDEX "CrawlRun_status_idx" ON "CrawlRun"("status");
CREATE INDEX "CrawlRunItem_runId_status_idx" ON "CrawlRunItem"("runId", "status");
CREATE UNIQUE INDEX "DiscoveryEvidence_tenantId_source_evidenceUrl_key" ON "DiscoveryEvidence"("tenantId", "source", "evidenceUrl");

ALTER TABLE "Job" ADD CONSTRAINT "Job_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CrawlRunItem" ADD CONSTRAINT "CrawlRunItem_runId_fkey" FOREIGN KEY ("runId") REFERENCES "CrawlRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrawlRunItem" ADD CONSTRAINT "CrawlRunItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DiscoveryEvidence" ADD CONSTRAINT "DiscoveryEvidence_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
