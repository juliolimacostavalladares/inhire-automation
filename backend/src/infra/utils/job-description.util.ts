import sanitizeHtml from "sanitize-html";

const MAX_DESCRIPTION_LENGTH = 1_000_000;

export function sanitizeJobDescription(input?: string): string | null {
  if (!input) return null;
  const sanitized = sanitizeHtml(input.slice(0, MAX_DESCRIPTION_LENGTH), {
    allowedTags: [
      "p",
      "div",
      "span",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "blockquote",
      "code",
      "pre",
      "a",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      span: ["lang"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: "a",
        attribs: { ...attribs, rel: "noopener noreferrer" },
      }),
    },
  });
  return sanitized.trim() || null;
}
