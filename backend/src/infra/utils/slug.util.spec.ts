import { jobSlug, slugify, slugVariants } from "./slug.util";

describe("slug utilities", () => {
  it("normalizes accents and punctuation", () => {
    expect(slugify("Análise & Dados S.A.")).toBe("analise-e-dados-s-a");
  });

  it("generates unique lookup variants", () => {
    expect(slugVariants("Empresa Brasil")).toEqual([
      "empresa-brasil",
      "empresabrasil",
      "empresa",
    ]);
  });

  it("returns a safe fallback for an empty job title", () => {
    expect(jobSlug("!!!")).toBe("vaga");
  });
});
