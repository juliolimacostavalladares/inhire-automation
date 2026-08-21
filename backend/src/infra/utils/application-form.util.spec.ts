import { buildApplicationForm } from "./application-form.util";

describe("buildApplicationForm", () => {
  it("accurately builds dynamic application form matching InHire fields, labels and placeholders", () => {
    const v4JobPayload = {
      jobId: "f029c4bf-9163-4689-84fd-7376af303d5c",
      displayName: "🚀 Vaga | BDR/SDR B2B (Júnior e Pleno) | Presencial | Florianópolis/SC",
      workplaceType: "On-site",
      location: "Florianópolis, Santa Catarina, Brasil",
      contractType: ["PJ"],
      privacyPolicyUrl: "https://www.inhire.com.br/privacidade",
      settings: {
        fields: [
          "linkedin",
          "location",
          "workModel",
          "curriculum",
          "salary",
          "referral",
        ],
        requiredFields: [
          "linkedin",
          "location",
          "workModel",
          "curriculum",
          "salary",
        ],
      },
    };

    const form = buildApplicationForm(v4JobPayload);

    expect(form.version).toBe(1);
    expect(form.recaptchaRequired).toBe(true);

    // 1. Core Contact Fields
    expect(form.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "name",
          label: "Nome completo",
          placeholder: "Seu nome completo",
          required: true,
        }),
        expect.objectContaining({
          key: "email",
          label: "Seu melhor email",
          placeholder: "Seu melhor email",
          required: true,
        }),
        expect.objectContaining({
          key: "phone",
          label: "Celular com DDD",
          placeholder: "(00) 00000-0000",
          helpText: "+55",
          required: true,
        }),
      ]),
    );

    // 2. LinkedIn
    expect(form.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "linkedinUsername",
          label: "Linkedin",
          placeholder: "https://linkedin.com/in/seu-perfil",
          helpText: "(Copie o link do seu perfil do Linkedin e cole no campo acima)",
          required: true,
        }),
      ]),
    );

    // 3. Location (Country + City)
    expect(form.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "country",
          label: "País de origem",
          type: "select",
          required: true,
        }),
        expect.objectContaining({
          key: "location",
          label: "Cidade",
          placeholder: "Informe sua cidade",
          required: true,
        }),
      ]),
    );

    // 4. Work Model Question with Workplace + Location
    expect(form.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "workModel",
          label: "Você tem disponibilidade para trabalhar no modelo presencial em Florianópolis, Santa Catarina, Brasil?",
          type: "boolean",
          required: true,
          options: ["Sim", "Não"],
        }),
      ]),
    );

    // 5. Curriculum
    expect(form.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "curriculum",
          label: "Currículo",
          type: "file",
          required: true,
        }),
      ]),
    );

    // 6. Salary combined with single contract PJ
    expect(form.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "salaryExpectation",
          label: "Pretensão salarial como PJ",
          placeholder: "R$ 0.000,00",
          required: true,
        }),
      ]),
    );

    // 7. Referral
    expect(form.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "referral",
          label: "Você foi indicado por alguém da empresa?",
          type: "referral",
          required: false,
          options: ["Não", "Sim"],
        }),
      ]),
    );

    // 8. Privacy policy
    expect(form.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "privacyPolicyAccepted",
          label: "Ao fornecer seus dados pessoais, você concorda com o que está descrito nesta Política de Privacidade.",
          required: true,
        }),
      ]),
    );
  });

  it("handles multiple contract types on salary field", () => {
    const jobPayload = {
      jobId: "job-multi",
      displayName: "Engenheiro de Software",
      contractType: ["CLT", "PJ"],
      settings: {
        fields: ["salary"],
        requiredFields: ["salary"],
      },
    };

    const form = buildApplicationForm(jobPayload);

    expect(form.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "salaryExpectation",
          label: "Pretensão salarial",
          required: true,
        }),
        expect.objectContaining({
          key: "contractType",
          label: "Tipo de Contrato",
          options: ["CLT", "PJ"],
          required: true,
        }),
      ]),
    );
  });
});
