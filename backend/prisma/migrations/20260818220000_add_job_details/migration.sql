ALTER TABLE "Job"
ADD COLUMN "descriptionHtml" TEXT,
ADD COLUMN "publishedAt" TIMESTAMP(3),
ADD COLUMN "lastPublishedAt" TIMESTAMP(3),
ADD COLUMN "detailFetchedAt" TIMESTAMP(3);

CREATE INDEX "Job_publishedAt_idx" ON "Job"("publishedAt");
