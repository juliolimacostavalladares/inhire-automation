import { buildApplicationForm } from "./application-form.util";

describe("buildApplicationForm", () => {
  it("maps required fields and conditional diversity questions", () => {
    const form = buildApplicationForm({
      jobId: "job-1",
      displayName: "Developer",
      settings: {
        fields: ["linkedin", "salary", "curriculum", "workModel"],
        requiredFields: ["linkedin", "salary", "curriculum", "workModel"],
      },
      contractType: ["CLT", "PJ"],
      privacyPolicyUrl: "https://example.com/privacy",
      diversity: {
        questions: [
          {
            id: "pcd",
            title: "Pessoa com deficiência",
            answerType: "singleChoice",
            active: true,
            required: true,
            answerOptions: [
              { id: "yes", title: "Sim", subQuestionIds: ["pcd-cid"] },
            ],
          },
          {
            id: "pcd-cid",
            title: "CID",
            answerType: "shortText",
            active: true,
            isSubQuestionOf: "pcd",
          },
        ],
      },
    });

    expect(form.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "linkedinUsername", required: true }),
        expect.objectContaining({
          key: "contractType",
          options: ["CLT", "PJ"],
        }),
      ]),
    );
    expect(form.diversityQuestions[1]).toMatchObject({
      id: "pcd-cid",
      dependsOnQuestionId: "pcd",
    });
  });

  it("removes unsafe policy URLs and inactive questions", () => {
    const form = buildApplicationForm({
      jobId: "job-1",
      displayName: "Developer",
      privacyPolicyUrl: "javascript:alert(1)",
      diversity: { questions: [{ id: "hidden", active: false }] },
    });
    expect(form.privacyPolicyUrl).toBeNull();
    expect(form.diversityQuestions).toEqual([]);
  });
});
