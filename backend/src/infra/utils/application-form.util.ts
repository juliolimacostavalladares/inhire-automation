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

const FIELD_METADATA: Record<
  string,
  { key: string; label: string; type: string; placeholder: string; helpText?: string }
> = {
  linkedin: {
    key: "linkedinUsername",
    label: "Perfil do LinkedIn",
    type: "url",
    placeholder: "https://linkedin.com/in/seuperfil",
    helpText: "Cole o link completo do seu perfil no LinkedIn",
  },
  salary: {
    key: "salaryExpectation",
    label: "Pretensão Salarial",
    type: "currency",
    placeholder: "R$ 0,00",
    helpText: "Informe sua pretensão salarial mensal bruta",
  },
  curriculum: {
    key: "curriculum",
    label: "Currículo",
    type: "file",
    placeholder: "Anexe seu currículo em PDF",
    helpText: "Envie seu currículo atualizado ou use o currículo ATS gerado",
  },
  workModel: {
    key: "workModel",
    label: "Disponibilidade de Modelo de Trabalho",
    type: "boolean",
    placeholder: "",
    helpText: "Confirme sua disponibilidade para o modelo de trabalho desta vaga",
  },
  location: {
    key: "location",
    label: "Cidade e Estado de Residência",
    type: "text",
    placeholder: "Ex: São Paulo, SP",
    helpText: "Informe onde você reside atualmente",
  },
  cep: {
    key: "cep",
    label: "CEP",
    type: "text",
    placeholder: "00000-000",
    helpText: "Informe seu código de endereçamento postal",
  },
  referral: {
    key: "referralEmail",
    label: "Indicação de Colaborador",
    type: "email",
    placeholder: "colega@empresa.com",
    helpText: "Caso tenha sido indicado por alguém da empresa, informe o e-mail",
  },
  portfolio: {
    key: "portfolioUrl",
    label: "Portfólio / GitHub",
    type: "url",
    placeholder: "https://github.com/seuperfil",
    helpText: "Link para seu portfólio, GitHub ou site pessoal",
  },
};

export function buildApplicationForm(detail: InhireJobDetail) {
  const visible = detail.settings?.fields ?? [];
  const required = new Set(detail.settings?.requiredFields ?? []);

  const configuredFields: IApplicationFormField[] = visible.map((sourceKey: string) => {
    const meta = FIELD_METADATA[sourceKey];
    if (meta) {
      let label = meta.label;
      let helpText = meta.helpText;
      if (sourceKey === "workModel" && detail.workplaceType) {
        const workplace =
          detail.workplaceType === "On-site"
            ? "Presencial"
            : detail.workplaceType === "Hybrid"
              ? "Híbrido"
              : "Remoto";
        const loc = detail.location ? ` em ${detail.location}` : "";
        label = `Disponibilidade para modelo ${workplace}${loc}`;
        helpText = `Você possui disponibilidade para atuar no modelo ${workplace}${loc}?`;
      }
      return {
        key: meta.key,
        label,
        type: meta.type,
        placeholder: meta.placeholder,
        helpText,
        required: required.has(sourceKey),
        options: [],
      };
    }

    // Fallback para campos customizados adicionais
    const humanized = sourceKey
      .replace(/([A-Z])/g, " $1")
      .replace(/[_-]/g, " ")
      .trim();
    const capitalized = humanized.charAt(0).toUpperCase() + humanized.slice(1);
    return {
      key: sourceKey,
      label: capitalized,
      type: "text",
      placeholder: `Informe ${humanized.toLowerCase()}`,
      required: required.has(sourceKey),
      options: [],
    };
  });

  if (visible.includes("salary")) {
    configuredFields.push({
      key: "contractType",
      label: "Tipo de Contrato",
      type: "select",
      placeholder: "Selecione o tipo de contrato",
      helpText: "Selecione a modalidade de contratação desejada",
      required: required.has("salary"),
      options: detail.contractType ?? [],
    });
  }

  const baseFields: IApplicationFormField[] = [
    {
      key: "name",
      label: "Nome completo",
      type: "text",
      placeholder: "Ex: Júlio Lima",
      helpText: "Informe seu nome e sobrenome",
      required: true,
      options: [],
    },
    {
      key: "email",
      label: "E-mail",
      type: "email",
      placeholder: "seu.email@exemplo.com",
      helpText: "E-mail principal para receber atualizações do processo seletivo",
      required: true,
      options: [],
    },
    {
      key: "phone",
      label: "WhatsApp / Telefone",
      type: "tel",
      placeholder: "(11) 99999-9999",
      helpText: "Telefone com DDD para contato da equipe de recrutamento",
      required: true,
      options: [],
    },
    ...configuredFields,
    {
      key: "privacyPolicyAccepted",
      label: "Termos de Privacidade e LGPD",
      type: "boolean",
      placeholder: "",
      helpText: "Concordância com o tratamento de dados pessoais para o processo seletivo",
      required: true,
      options: [],
    },
  ];

  return {
    version: 1,
    recaptchaRequired: true,
    privacyPolicyUrl: safeHttpUrl(detail.privacyPolicyUrl),
    fields: baseFields,
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
