import {
  InhireDiversityQuestion,
  InhireJobDetail,
} from "../providers/inhire/inhire.types";
import { sanitizeJobDescription } from "./job-description.util";

type FormField = {
  key: string;
  type: string;
  required: boolean;
  options: string[];
};

const FIELD_TYPES: Record<string, { key: string; type: string }> = {
  linkedin: { key: "linkedinUsername", type: "url" },
  salary: { key: "salaryExpectation", type: "currency" },
  curriculum: { key: "curriculum", type: "file" },
  workModel: { key: "workModel", type: "boolean" },
  location: { key: "location", type: "text" },
  cep: { key: "cep", type: "text" },
  referral: { key: "referralEmail", type: "email" },
};

export function buildApplicationForm(detail: InhireJobDetail) {
  const visible = detail.settings?.fields ?? [];
  const required = new Set(detail.settings?.requiredFields ?? []);
  const configuredFields = visible.map<FormField>((sourceKey: string) => {
    const mapped = FIELD_TYPES[sourceKey] ?? {
      key: sourceKey,
      type: "unknown",
    };
    return { ...mapped, required: required.has(sourceKey), options: [] };
  });

  if (visible.includes("salary")) {
    configuredFields.push({
      key: "contractType",
      type: "select",
      required: required.has("salary"),
      options: detail.contractType ?? [],
    });
  }

  return {
    version: 1,
    recaptchaRequired: true,
    privacyPolicyUrl: safeHttpUrl(detail.privacyPolicyUrl),
    fields: [
      { key: "name", type: "text", required: true, options: [] },
      { key: "email", type: "email", required: true, options: [] },
      { key: "phone", type: "tel", required: true, options: [] },
      ...configuredFields,
      {
        key: "privacyPolicyAccepted",
        type: "boolean",
        required: true,
        options: [],
      },
    ],
    diversityIntroductionHtml: sanitizeJobDescription(
      detail.diversity?.introduction,
    ),
    diversityQuestions: (detail.diversity?.questions ?? [])
      .filter((question: InhireDiversityQuestion) => question.active !== false && question.id)
      .sort((a: InhireDiversityQuestion, b: InhireDiversityQuestion) => (a.order ?? 0) - (b.order ?? 0))
      .map(normalizeQuestion),
  };
}

function normalizeQuestion(question: InhireDiversityQuestion) {
  return {
    id: question.id,
    title: question.title ?? null,
    question: question.question ?? null,
    descriptionHtml: sanitizeJobDescription(question.description),
    subTitle: question.subTitle ?? null,
    placeholder: question.placeholder ?? null,
    answerType: question.answerType ?? "unknown",
    required: Boolean(question.required),
    diversityGroup: question.diversityGroup ?? null,
    dependsOnQuestionId: question.isSubQuestionOf ?? null,
    options: (question.answerOptions ?? [])
      .sort((a: { order?: number }, b: { order?: number }) => (a.order ?? 0) - (b.order ?? 0))
      .map((option: { id: string; title?: string; description?: string; subQuestionIds?: string[] }) => ({
        id: option.id,
        title: option.title ?? null,
        descriptionHtml: sanitizeJobDescription(option.description),
        revealsQuestionIds: option.subQuestionIds ?? [],
      })),
  };
}

function safeHttpUrl(value?: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
