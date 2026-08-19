import { HttpService } from "@nestjs/axios";
import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { AxiosError } from "axios";
import { firstValueFrom } from "rxjs";
import { InhireJobDetail, InhireTenantPage } from "./inhire.types";

@Injectable()
export class InhireClientService {
  private readonly endpoint = "https://api.inhire.app/job-posts/public/pages";

  constructor(private readonly http: HttpService) {}

  async fetchTenant(slug: string): Promise<InhireTenantPage | null> {
    return this.getWithRetry(this.endpoint, slug, (value) =>
      this.isTenantPage(value) ? value : null,
    );
  }

  async fetchJobDetail(
    slug: string,
    jobId: string,
  ): Promise<InhireJobDetail | null> {
    return this.getWithRetry(
      `${this.endpoint}/${encodeURIComponent(jobId)}`,
      slug,
      (value) => (this.isJobDetail(value) ? value : null),
    );
  }

  private async getWithRetry<T>(
    url: string,
    slug: string,
    parse: (value: unknown) => T | null,
  ): Promise<T | null> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await firstValueFrom(
          this.http.get<unknown>(url, {
            headers: {
              "X-Tenant": slug,
              "X-Inhire-Client": "web-inhire",
              Accept: "application/json",
            },
            timeout: 15_000,
            maxContentLength: 2_000_000,
            maxBodyLength: 2_000_000,
          }),
        );
        if (Array.isArray(response.data)) return null;
        return parse(response.data);
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 404)
          return null;
        if (attempt < 2)
          await new Promise((resolve) =>
            setTimeout(resolve, 500 * 2 ** attempt),
          );
      }
    }
    throw new ServiceUnavailableException("InHire is temporarily unavailable");
  }

  private isJobDetail(value: unknown): value is InhireJobDetail {
    if (!value || typeof value !== "object") return false;
    const fields = value as Record<string, unknown>;
    return (
      typeof fields.jobId === "string" &&
      typeof fields.displayName === "string" &&
      (fields.description === undefined ||
        typeof fields.description === "string") &&
      (fields.publishedAt === undefined ||
        typeof fields.publishedAt === "string") &&
      (fields.lastPublishedAt === undefined ||
        typeof fields.lastPublishedAt === "string") &&
      (fields.contractType === undefined ||
        this.isStringArray(fields.contractType)) &&
      (fields.privacyPolicyUrl === undefined ||
        typeof fields.privacyPolicyUrl === "string") &&
      (fields.settings === undefined || this.isSettings(fields.settings)) &&
      (fields.diversity === undefined || this.isDiversity(fields.diversity))
    );
  }

  private isSettings(value: unknown): boolean {
    if (!value || typeof value !== "object") return false;
    const settings = value as Record<string, unknown>;
    return (
      (settings.fields === undefined || this.isStringArray(settings.fields)) &&
      (settings.requiredFields === undefined ||
        this.isStringArray(settings.requiredFields))
    );
  }

  private isDiversity(value: unknown): boolean {
    if (!value || typeof value !== "object") return false;
    const diversity = value as Record<string, unknown>;
    return (
      (diversity.introduction === undefined ||
        typeof diversity.introduction === "string") &&
      (diversity.questions === undefined ||
        (Array.isArray(diversity.questions) &&
          diversity.questions.every((question) =>
            this.isDiversityQuestion(question),
          )))
    );
  }

  private isDiversityQuestion(value: unknown): boolean {
    if (!value || typeof value !== "object") return false;
    const question = value as Record<string, unknown>;
    return (
      typeof question.id === "string" &&
      (question.active === undefined || typeof question.active === "boolean") &&
      (question.required === undefined ||
        typeof question.required === "boolean") &&
      (question.order === undefined || typeof question.order === "number") &&
      (question.answerOptions === undefined ||
        (Array.isArray(question.answerOptions) &&
          question.answerOptions.every((option) => {
            if (!option || typeof option !== "object") return false;
            const fields = option as Record<string, unknown>;
            return (
              typeof fields.id === "string" &&
              (fields.subQuestionIds === undefined ||
                this.isStringArray(fields.subQuestionIds))
            );
          })))
    );
  }

  private isStringArray(value: unknown): value is string[] {
    return (
      Array.isArray(value) && value.every((item) => typeof item === "string")
    );
  }

  private isTenantPage(value: unknown): value is InhireTenantPage {
    if (!value || typeof value !== "object") return false;
    const candidate = value as Record<string, unknown>;
    return (
      typeof candidate.tenantName === "string" &&
      Array.isArray(candidate.jobsPage) &&
      candidate.jobsPage.every((job) => {
        if (!job || typeof job !== "object") return false;
        const fields = job as Record<string, unknown>;
        return (
          typeof fields.jobId === "string" &&
          typeof fields.displayName === "string" &&
          (fields.workplaceType === undefined ||
            typeof fields.workplaceType === "string") &&
          (fields.location === undefined ||
            typeof fields.location === "string") &&
          (fields.status === undefined || typeof fields.status === "string")
        );
      })
    );
  }
}
