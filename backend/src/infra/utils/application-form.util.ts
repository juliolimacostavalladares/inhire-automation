import {
  InhireDiversityQuestion,
  InhireJobDetail,
} from "../providers/inhire/inhire.types";
import { sanitizeJobDescription } from "./job-description.util";

export interface IApplicationFormField {
  key: string;
  label: string;
  type: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options: string[];
}

export function buildApplicationForm(detail: InhireJobDetail) {
  const visible = detail.settings?.fields ?? [];
  const required = new Set(detail.settings?.requiredFields ?? []);

  const baseFields: IApplicationFormField[] = [
    {
      key: "name",
      label: "Nome completo",
      type: "text",
      placeholder: "Seu nome completo",
      required: true,
      options: [],
    },
    {
      key: "email",
      label: "Seu melhor email",
      type: "email",
      placeholder: "Seu melhor email",
      required: true,
      options: [],
    },
    {
      key: "phone",
      label: "Celular com DDD",
      type: "tel",
      placeholder: "(00) 00000-0000",
      helpText: "+55",
      required: true,
      options: [],
    },
  ];

  const dynamicFields: IApplicationFormField[] = [];

  // 1. LinkedIn
  if (visible.includes("linkedin")) {
    dynamicFields.push({
      key: "linkedinUsername",
      label: "Linkedin",
      type: "url",
      placeholder: "https://linkedin.com/in/seu-perfil",
      helpText: "(Copie o link do seu perfil do Linkedin e cole no campo acima)",
      required: required.has("linkedin"),
      options: [],
    });
  }

  // 2. Location (País + Cidade)
  if (visible.includes("location")) {
    dynamicFields.push({
      key: "country",
      label: "País de origem",
      type: "select",
      placeholder: "Selecione o país",
      required: required.has("location"),
      options: ["Brasil", "Portugal", "Estados Unidos", "Argentina", "Outro"],
    });
    dynamicFields.push({
      key: "location",
      label: "Cidade",
      type: "text",
      placeholder: "Informe sua cidade",
      required: required.has("location"),
      options: [],
    });
  }

  // 3. CEP (se configurado separadamente)
  if (visible.includes("cep")) {
    dynamicFields.push({
      key: "cep",
      label: "CEP",
      type: "text",
      placeholder: "00000-000",
      required: required.has("cep"),
      options: [],
    });
  }

  // 4. Work Model (Disponibilidade para o modelo da vaga)
  if (visible.includes("workModel")) {
    const workplace =
      detail.workplaceType === "On-site"
        ? "presencial"
        : detail.workplaceType === "Hybrid"
          ? "híbrido"
          : "remoto";
    const loc = detail.location ? ` em ${detail.location}` : "";
    dynamicFields.push({
      key: "workModel",
      label: `Você tem disponibilidade para trabalhar no modelo ${workplace}${loc}?`,
      type: "boolean",
      placeholder: "",
      required: required.has("workModel"),
      options: ["Sim", "Não"],
    });
  }

  // 5. Curriculum (Currículo)
  if (visible.includes("curriculum")) {
    dynamicFields.push({
      key: "curriculum",
      label: "Currículo",
      type: "file",
      placeholder: "Anexar currículo",
      required: required.has("curriculum"),
      options: [],
    });
  }

  // 6. Salary & Contract Type
  if (visible.includes("salary")) {
    const singleContract =
      detail.contractType && detail.contractType.length === 1
        ? detail.contractType[0]
        : null;

    dynamicFields.push({
      key: "salaryExpectation",
      label: singleContract
        ? `Pretensão salarial como ${singleContract}`
        : "Pretensão salarial",
      type: "currency",
      placeholder: "R$ 0.000,00",
      required: required.has("salary"),
      options: [],
    });

    if (detail.contractType && detail.contractType.length > 1) {
      dynamicFields.push({
        key: "contractType",
        label: "Tipo de Contrato",
        type: "select",
        placeholder: "Selecione o tipo de contrato",
        required: required.has("salary"),
        options: detail.contractType,
      });
    }
  }

  // 7. Referral (Indicação)
  if (visible.includes("referral")) {
    dynamicFields.push({
      key: "referral",
      label: "Você foi indicado por alguém da empresa?",
      type: "referral",
      placeholder: "E-mail ou nome de quem indicou",
      required: required.has("referral"),
      options: ["Não", "Sim"],
    });
  }

  // 8. Custom fields that might be configured by tenants
  for (const sourceKey of visible) {
    if (
      [
        "linkedin",
        "location",
        "cep",
        "workModel",
        "curriculum",
        "salary",
        "referral",
      ].includes(sourceKey)
    ) {
      continue;
    }
    const humanized = sourceKey
      .replace(/([A-Z])/g, " $1")
      .replace(/[_-]/g, " ")
      .trim();
    const capitalized = humanized.charAt(0).toUpperCase() + humanized.slice(1);
    dynamicFields.push({
      key: sourceKey,
      label: capitalized,
      type: "text",
      placeholder: `Informe ${humanized.toLowerCase()}`,
      required: required.has(sourceKey),
      options: [],
    });
  }

  // 9. Privacy Policy Consent
  dynamicFields.push({
    key: "privacyPolicyAccepted",
    label:
      "Ao fornecer seus dados pessoais, você concorda com o que está descrito nesta Política de Privacidade.",
    type: "boolean",
    placeholder: "",
    required: true,
    options: [],
  });

  return {
    version: 1,
    recaptchaRequired: true,
    privacyPolicyUrl: safeHttpUrl(detail.privacyPolicyUrl),
    fields: [...baseFields, ...dynamicFields],
    diversityIntroductionHtml: sanitizeJobDescription(
      detail.diversity?.introduction,
    ),
    diversityQuestions: (detail.diversity?.questions ?? [])
      .filter(
        (question: InhireDiversityQuestion) =>
          question.active !== false && question.id,
      )
      .sort(
        (a: InhireDiversityQuestion, b: InhireDiversityQuestion) =>
          (a.order ?? 0) - (b.order ?? 0),
      )
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
      .sort(
        (a: { order?: number }, b: { order?: number }) =>
          (a.order ?? 0) - (b.order ?? 0),
      )
      .map(
        (option: {
          id: string;
          title?: string;
          description?: string;
          subQuestionIds?: string[];
        }) => ({
          id: option.id,
          title: option.title ?? null,
          descriptionHtml: sanitizeJobDescription(option.description),
          revealsQuestionIds: option.subQuestionIds ?? [],
        }),
      ),
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
