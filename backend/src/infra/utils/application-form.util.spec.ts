import { buildApplicationForm } from "./application-form.util";

describe("buildApplicationForm", () => {
  it("accurately builds dynamic application form from real InHire vacancy payload (Qeevo / Quero Educação)", () => {
    const qeevoJobPayload = {
      jobId: "afb046bb-e4ed-4b72-981f-f59d33c2d1df",
      displayName: "Estagiário(a) de Data Analytics",
      workplaceType: "On-site",
      location: "São José dos Campos, SP, BR",
      contractType: ["Estágio"],
      privacyPolicyUrl: "https://files.inhire.app/pages/career/privacy_policy.pdf",
      settings: {
        fields: [
          "linkedin",
          "salary",
          "curriculum",
          "workModel",
          "referral",
          "location",
        ],
        requiredFields: [
          "linkedin",
          "salary",
          "curriculum",
          "workModel",
        ],
      },
      diversity: {
        introduction: "<p>Valorizamos a diversidade e a inclusão em nosso time.</p>",
        questions: [
          {
            id: "diversity_gender",
            title: "Gênero",
            question: "Qual a sua identidade de gênero?",
            answerType: "singleChoice",
            active: true,
            required: true,
            order: 1,
            answerOptions: [
              { id: "opt_fem", title: "Mulher (cis ou trans)" },
              { id: "opt_masc", title: "Homem (cis ou trans)" },
              { id: "opt_nb", title: "Não-binário" },
              { id: "opt_pref", title: "Prefiro não responder" },
            ],
          },
          {
            id: "diversity_pcd",
            title: "PCD",
            question: "Você é uma pessoa com deficiência (PCD)?",
            answerType: "singleChoice",
            active: true,
            required: true,
            order: 2,
            answerOptions: [
              { id: "pcd_sim", title: "Sim", subQuestionIds: ["pcd_laudo"] },
              { id: "pcd_nao", title: "Não" },
            ],
          },
          {
            id: "pcd_laudo",
            title: "Laudo PCD",
            question: "Informe detalhes do seu laudo médico / CID",
            answerType: "shortText",
            active: true,
            required: false,
            order: 3,
            isSubQuestionOf: "diversity_pcd",
          },
        ],
      },
    };

    const form = buildApplicationForm(qeevoJobPayload);

    // 1. Version and Privacy Policy
    expect(form.version).toBe(1);
    expect(form.recaptchaRequired).toBe(true);
    expect(form.privacyPolicyUrl).toBe("https://files.inhire.app/pages/career/privacy_policy.pdf");

    // 2. Base Contact Fields
    expect(form.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "name", label: "Nome completo", required: true }),
        expect.objectContaining({ key: "email", label: "E-mail", required: true }),
        expect.objectContaining({ key: "phone", label: "WhatsApp / Telefone", required: true }),
      ]),
    );

    // 3. Configured Dynamic Fields from settings.fields and requiredFields
    expect(form.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "linkedinUsername",
          label: "Perfil do LinkedIn",
          type: "url",
          required: true,
        }),
        expect.objectContaining({
          key: "salaryExpectation",
          label: "Pretensão Salarial",
          type: "currency",
          required: true,
        }),
        expect.objectContaining({
          key: "contractType",
          label: "Tipo de Contrato",
          type: "select",
          required: true,
          options: ["Estágio"],
        }),
        expect.objectContaining({
          key: "curriculum",
          label: "Currículo",
          type: "file",
          required: true,
        }),
        expect.objectContaining({
          key: "workModel",
          label: "Disponibilidade para modelo Presencial em São José dos Campos, SP, BR",
          type: "boolean",
          required: true,
        }),
        expect.objectContaining({
          key: "referralEmail",
          label: "Indicação de Colaborador",
          type: "email",
          required: false,
        }),
        expect.objectContaining({
          key: "location",
          label: "Cidade e Estado de Residência",
          type: "text",
          required: false,
        }),
        expect.objectContaining({
          key: "privacyPolicyAccepted",
          label: "Termos de Privacidade e LGPD",
          required: true,
        }),
      ]),
    );

    // 4. Diversity Questions
    expect(form.diversityQuestions).toHaveLength(3);
    expect(form.diversityQuestions[0]).toMatchObject({
      id: "diversity_gender",
      title: "Gênero",
      question: "Qual a sua identidade de gênero?",
      required: true,
      options: expect.arrayContaining([
        expect.objectContaining({ id: "opt_fem", title: "Mulher (cis ou trans)" }),
      ]),
    });
    expect(form.diversityQuestions[1]).toMatchObject({
      id: "diversity_pcd",
      required: true,
      options: expect.arrayContaining([
        expect.objectContaining({ id: "pcd_sim", title: "Sim", revealsQuestionIds: ["pcd_laudo"] }),
      ]),
    });
    expect(form.diversityQuestions[2]).toMatchObject({
      id: "pcd_laudo",
      dependsOnQuestionId: "diversity_pcd",
      required: false,
    });
  });

  it("handles minimal vacancy without optional settings or diversity questions", () => {
    const minimalJob = {
      jobId: "min-job-1",
      displayName: "Analista",
    };

    const form = buildApplicationForm(minimalJob);

    expect(form.fields).toHaveLength(4); // name, email, phone, privacyPolicyAccepted
    expect(form.diversityQuestions).toEqual([]);
    expect(form.privacyPolicyUrl).toBeNull();
  });

  it("removes unsafe policy URLs and filters inactive questions", () => {
    const form = buildApplicationForm({
      jobId: "job-1",
      displayName: "Developer",
      privacyPolicyUrl: "javascript:alert(1)",
      diversity: {
        questions: [
          { id: "inactive_q", active: false },
          { id: "active_q", active: true, title: "Questão Ativa" },
        ],
      },
    });

    expect(form.privacyPolicyUrl).toBeNull();
    expect(form.diversityQuestions).toHaveLength(1);
    expect(form.diversityQuestions[0].id).toBe("active_q");
  });
});
