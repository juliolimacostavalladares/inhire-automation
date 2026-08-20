/**
 * LinkedIn PDF parser — estrutura extraída do formato oficial do LinkedIn.
 *
 * Formato das seções no PDF:
 *
 * Experience:
 *   Company
 *   Title
 *   Month Year - Month Year (duration) | Month Year - Present (duration)
 *   Location (opcional — curto, sem dígitos)
 *   description lines…
 *
 * Education:
 *   School
 *   Degree, Field · (Month Year - Month Year)
 *
 * NOTA: LinkedIn usa \u00a0 (non-breaking space) como separador em datas.
 * Normalizamos para espaço regular antes de qualquer parse.
 */

// ─── Tipos públicos ──────────────────────────────────────────────────────────

export interface ExperienceEntry {
  company: string;
  title: string;
  startMonth: string | null;
  startYear: string | null;
  endMonth: string | null;
  endYear: string | null;
  ongoing: boolean;
  location: string | null;
  description: string | null;
}

export interface EducationEntry {
  school: string;
  degree: string | null;
  field: string | null;
  startMonth: string | null;
  startYear: string | null;
  endMonth: string | null;
  endYear: string | null;
  ongoing: boolean;
}

export interface ParsedProfile {
  fullName: string | null;
  professionalTitle: string | null;
  location: string | null;
  phone: string | null;
  summary: string | null;
  skills: string[];
  experiences: ExperienceEntry[];
  education: EducationEntry[];
}

// ─── Helpers internos ────────────────────────────────────────────────────────

const PAGE_RE = /^Page\s+\d+\s+of\s+\d+$/i;

/** LinkedIn usa \xa0 como separador nas datas — normaliza para espaço regular. */
function normalize(s: string): string {
  return s.replace(/[\u00a0\u202f\u2009]/g, " ").trim();
}

/** "May 2025 - Present (1 year 4 months)" ou "February 2023 - May 2025 (2 years)" */
const DATE_LINE_RE =
  /^([A-Za-záàãâéêíóôõú]+\s+\d{4}|\d{4})\s*[-–]\s*(Present|Presente|[A-Za-záàãâéêíóôõú]+\s+\d{4}|\d{4})(?:\s*\([^)]+\))?$/i;

/** "· (February 2019 - December 2021)" ou "(2003 - 2013)" */
const EDU_DATE_RE =
  /(?:[·•]\s*)?\(([A-Za-záàãâéêíóôõú]+\s+\d{4}|\d{4})\s*[-–]\s*([A-Za-záàãâéêíóôõú]+\s+\d{4}|\d{4})\)/i;

const PHONE_RE = /^\+?[\d\s\-(). ]{7,20}(?:\s*\(Mobile\))?$/i;

/** Seções conhecidas que delimitam blocos de conteúdo */
const CONTENT_SECTIONS = new Set([
  "experience", "experiência", "experiencia",
  "education", "educação", "formação", "formacao",
  "summary", "sobre", "resumo",
  "skills", "top skills", "competências", "habilidades",
]);

/** Seções que aparecem no PDF mas não delimitam conteúdo relevante */
const NOISE_SECTIONS = new Set([
  "contact", "certifications", "certificações", "languages", "idiomas",
]);

function isSectionHeading(line: string): boolean {
  const l = line.toLowerCase();
  return CONTENT_SECTIONS.has(l) || NOISE_SECTIONS.has(l);
}

function parseMonthYear(token: string): { month: string | null; year: string | null } {
  token = token.trim();
  if (/^\d{4}$/.test(token)) return { month: null, year: token };
  const parts = token.split(/\s+/);
  if (parts.length === 2) return { month: parts[0], year: parts[1] };
  return { month: null, year: token };
}

function parseDateLine(line: string): {
  startMonth: string | null;
  startYear: string | null;
  endMonth: string | null;
  endYear: string | null;
  ongoing: boolean;
} | null {
  const norm = normalize(line);
  const m = DATE_LINE_RE.exec(norm);
  if (!m) return null;
  const from = parseMonthYear(m[1]);
  const ongoing = /present|presente/i.test(m[2]);
  const to = ongoing ? { month: null, year: null } : parseMonthYear(m[2]);
  return {
    startMonth: from.month,
    startYear: from.year,
    endMonth: to.month,
    endYear: to.year,
    ongoing,
  };
}

function parseEduDateInLine(line: string): {
  startMonth: string | null;
  startYear: string | null;
  endMonth: string | null;
  endYear: string | null;
  ongoing: boolean;
} | null {
  const norm = normalize(line);
  const m = EDU_DATE_RE.exec(norm);
  if (!m) return null;
  const from = parseMonthYear(m[1]);
  const to = parseMonthYear(m[2]);
  return {
    startMonth: from.month,
    startYear: from.year,
    endMonth: to.month,
    endYear: to.year,
    ongoing: false,
  };
}

/** Extrai as linhas de uma seção do PDF até encontrar a próxima seção conhecida. */
function extractSection(lines: string[], headings: string[]): string[] {
  const idx = lines.findIndex((l) => headings.includes(normalize(l).toLowerCase()));
  if (idx < 0) return [];
  let end = lines.length;
  for (let i = idx + 1; i < lines.length; i++) {
    if (isSectionHeading(normalize(lines[i]).toLowerCase())) { end = i; break; }
  }
  return lines.slice(idx + 1, end);
}

// ─── Parser de Experience ────────────────────────────────────────────────────

/**
 * Padrão de bloco de experiência:
 *   [Company]
 *   [Title]          ← pode ser omitido se company == title
 *   [Date line]      ← obrigatório para detectar o bloco
 *   [Location]?      ← opcional, curta, sem dígitos no início
 *   [Description]    ← tudo o mais até o próximo bloco
 */
function parseExperiences(lines: string[]): ExperienceEntry[] {
  const results: ExperienceEntry[] = [];
  let i = 0;

  while (i < lines.length) {
    const norm = normalize(lines[i]);
    if (!norm || isSectionHeading(norm.toLowerCase())) { i++; continue; }

    // Procura a linha de data nas próximas 3 linhas
    let dateIdx = -1;
    for (let d = i + 1; d <= Math.min(i + 3, lines.length - 1); d++) {
      if (parseDateLine(lines[d])) { dateIdx = d; break; }
    }
    if (dateIdx < 0) { i++; continue; }

    // company = lines[i], title = lines entre i e dateIdx
    const company = normalize(lines[i]);
    const title = dateIdx > i + 1 ? normalize(lines[dateIdx - 1]) : company;
    const dateInfo = parseDateLine(lines[dateIdx])!;

    // Location: próxima linha após a data, se curta e sem dígito no início
    let location: string | null = null;
    let descStart = dateIdx + 1;
    if (descStart < lines.length) {
      const candidate = normalize(lines[descStart]);
      // Location é curta (≤ 5 palavras), não começa com dígito, não é seção
      const isLikelyLocation =
        candidate.length > 0 &&
        candidate.length < 60 &&
        candidate.split(" ").length <= 6 &&
        !/^\d/.test(candidate) &&
        !parseDateLine(candidate) &&
        !isSectionHeading(candidate.toLowerCase());
      if (isLikelyLocation) {
        location = candidate;
        descStart++;
      }
    }

    // Descrição: linhas até o próximo bloco de experiência (detectado por data line ±1)
    const descLines: string[] = [];
    let j = descStart;
    while (j < lines.length) {
      if (isSectionHeading(normalize(lines[j]).toLowerCase())) break;
      // Detecta início do próximo bloco: linha de data dentro das próximas 2
      const nextDateIn1 = j + 1 < lines.length && parseDateLine(lines[j + 1]);
      const nextDateIn2 = j + 2 < lines.length && parseDateLine(lines[j + 2]);
      if (nextDateIn1 || nextDateIn2) break;
      descLines.push(normalize(lines[j]));
      j++;
    }

    results.push({
      company,
      title,
      ...dateInfo,
      location,
      description: descLines.join("\n").trim() || null,
    });

    i = j > dateIdx ? j : dateIdx + 1;
  }

  return results;
}

// ─── Parser de Education ─────────────────────────────────────────────────────

/**
 * Padrão de bloco de educação:
 *   [School]
 *   [Degree, Field · (Month Year - Month Year)]  ← linha com data inline
 */
function parseEducation(lines: string[]): EducationEntry[] {
  const results: EducationEntry[] = [];
  let i = 0;

  while (i < lines.length) {
    const school = normalize(lines[i]);
    if (!school || isSectionHeading(school.toLowerCase())) { i++; continue; }

    let degree: string | null = null;
    let field: string | null = null;
    let dates = {
      startMonth: null as string | null,
      startYear: null as string | null,
      endMonth: null as string | null,
      endYear: null as string | null,
      ongoing: false,
    };

    if (i + 1 < lines.length) {
      const next = normalize(lines[i + 1]);
      const dateParsed = parseEduDateInLine(next);
      if (dateParsed) {
        dates = dateParsed;
        // Extrai degree/field da parte antes de " · " ou " • "
        const beforeDot = next.split(/\s*[·•]\s*/)[0].trim();
        if (beforeDot) {
          const segments = beforeDot.split(",").map((s) => s.trim());
          degree = segments[0] || null;
          field = segments.slice(1).join(", ") || null;
        }
        i += 2;
      } else {
        i++;
      }
    } else {
      i++;
    }

    results.push({ school, degree, field, ...dates });
  }

  return results;
}

// ─── Parser de Skills ────────────────────────────────────────────────────────

function parseSkills(lines: string[]): string[] {
  return lines
    .join(",")
    .split(/[,;|•\n]/)
    .map((s) => normalize(s))
    .filter((s) => s.length > 0 && s.length <= 80)
    .slice(0, 50);
}

// ─── Parser principal ────────────────────────────────────────────────────────

export function parseLinkedInPdf(rawText: string): ParsedProfile {
  // Normaliza non-breaking spaces antes de tudo
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => normalize(l.replace(/\u0000/g, "")))
    .filter((l) => l.length > 0 && !PAGE_RE.test(l));

  // ── Cabeçalho (antes da primeira seção conhecida) ──
  const firstSectionIdx = lines.findIndex((l) => isSectionHeading(l.toLowerCase()));
  const header = firstSectionIdx > 0 ? lines.slice(0, firstSectionIdx) : lines.slice(0, 10);

  // Nome: linha com ≥ 2 palavras, inicia com maiúscula, ≤ 60 chars
  const fullName =
    header.find((l) => /^[A-ZÀ-Ú][a-záàãâéêíóôõú]+ .+/.test(l) && l.length <= 60) ?? null;

  // Título profissional: linha logo após o nome (headline do LinkedIn)
  const nameIdx = fullName ? header.indexOf(fullName) : -1;
  const rawTitle = nameIdx >= 0 && nameIdx + 1 < header.length ? header[nameIdx + 1] : null;
  // Às vezes o título fica quebrado em 2 linhas — junta se a próxima começar com "&"
  const nextAfterTitle = nameIdx >= 0 && nameIdx + 2 < header.length ? header[nameIdx + 2] : null;
  const professionalTitle =
    rawTitle && nextAfterTitle && nextAfterTitle.startsWith("&")
      ? `${rawTitle} ${nextAfterTitle}`
      : rawTitle;

  // Localização: linha curta (≤ 5 palavras) sem dígitos e diferente do nome/título
  const location =
    header.find(
      (l) =>
        /^[A-ZÀ-Ú][a-záàãâéêíóôõú, .]+$/.test(l) &&
        l.split(" ").length <= 5 &&
        l !== fullName &&
        l !== professionalTitle &&
        l.toLowerCase() !== "contact",
    ) ?? null;

  // Telefone
  const phone =
    header.find((l) => PHONE_RE.test(l))?.replace(/\s*\(Mobile\)/i, "").trim() ?? null;

  // ── Seções ──
  const summaryLines = extractSection(lines, ["summary", "sobre", "resumo"]);
  const summary = summaryLines.join(" ").trim() || null;

  const skillLines = extractSection(lines, ["top skills", "skills", "competências", "habilidades"]);
  const skills = parseSkills(skillLines);

  const expLines = extractSection(lines, ["experience", "experiência", "experiencia"]);
  const experiences = parseExperiences(expLines);

  const eduLines = extractSection(lines, ["education", "formação", "educação", "formacao", "educacao"]);
  const education = parseEducation(eduLines);

  return { fullName, professionalTitle, location, phone, summary, skills, experiences, education };
}
