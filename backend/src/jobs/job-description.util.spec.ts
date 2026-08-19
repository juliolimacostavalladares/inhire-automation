import { sanitizeJobDescription } from "./job-description.util";

describe("sanitizeJobDescription", () => {
  it("preserves useful formatting and removes executable content", () => {
    const result = sanitizeJobDescription(
      '<p onclick="alert(1)">Vaga <strong>remota</strong></p><script>alert(2)</script>',
    );
    expect(result).toBe("<p>Vaga <strong>remota</strong></p>");
  });

  it("blocks unsafe link schemes and protects external links", () => {
    const result = sanitizeJobDescription(
      '<a href="javascript:alert(1)" target="_blank">Detalhes</a>',
    );
    expect(result).toBe(
      '<a target="_blank" rel="noopener noreferrer">Detalhes</a>',
    );
  });

  it("returns null for empty content", () => {
    expect(sanitizeJobDescription("<script>bad()</script>")).toBeNull();
  });
});
