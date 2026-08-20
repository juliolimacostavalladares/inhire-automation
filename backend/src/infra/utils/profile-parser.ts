/**
 * LinkedIn PDF Parser — baseado na metodologia robusta de análise de layout do PDFMiner / LinkedIn PDF Parser.
 *
 * Em vez de assumir que todo PDF de currículo possui exatamente a mesma ordem ou formato de campos,
 * este parser analisa os objetos de texto e suas propriedades de layout (tamanho de fonte/height,
 * seções reconhecidas, sequenciamento de blocos de empresa/cargo/datas/educação).
 */

import pdfParse from "pdf-parse";

// ─── Tipos Exportados ────────────────────────────────────────────────────────

export interface ExperienceEntry {
  company: string;
  title: string | null;
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

export interface LayoutItem {
  text: string;
  h: number;
  bold: boolean;
}

// ─── Regex e Dicionários ─────────────────────────────────────────────────────

const MONTHS =
  "january|february|march|april|may|june|july|august|september|october|november|december" +
  "|janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro" +
  "|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec";

// Regex flexível para intervalo de datas
const DATE_RANGE_RE = new RegExp(
  `^(?:[·•]\\s*)?\\(?(?:(${MONTHS})\\s+)?(\\d{4})\\s*[-–]\\s*(present|presente|(?:(${MONTHS})\\s+)?(\\d{4}))`,
  "i",
);

const IS_DATE_RE = new RegExp(
  `^(?:[·•]\\s*)?\\(?(?:(?:${MONTHS})\\s+)?\\d{4}\\s*[-–]\\s*(?:present|presente|(?:(?:${MONTHS})\\s+)?\\d{4})`,
  "i",
);

const DURATION_ONLY_RE = /^\(\d[\d\w\s,.]+\)$/;
const PHONE_RE = /^\+?[\d\s\-(). ]{7,20}(?:\s*\(Mobile\))?$/i;

const SECTION_MAIN_NAMES = new Set([
  "experience", "experiência", "experiencia",
  "education", "educação", "educacao", "formação", "formacao",
  "summary", "sobre", "resumo",
]);

const SECTION_AUX_NAMES = new Set([
  "contact", "contato",
  "skills", "top skills", "competências", "habilidades",
  "certifications", "certificações", "languages", "idiomas",
  "licenses & certifications", "accomplishments", "volunteer experience",
  "courses", "projects", "publications", "honors & awards",
]);

function normalizeText(s: string): string {
  return s.replace(/[\u00a0\u202f\u2009]/g, " ").trim();
}

function parseDateString(s: string) {
  const clean = normalizeText(s).replace(/\(.*\)$/, "").replace(/[()·•]/g, "").trim();
  const match = DATE_RANGE_RE.exec(normalizeText(s));

  if (match) {
    const startMonth = match[1] ?? null;
    const startYear = match[2] ?? null;
    const isOngoing = /present|presente/i.test(match[3]);
    const endMonth = isOngoing ? null : match[4] ?? null;
    const endYear = isOngoing ? null : match[5] ?? null;

    return { startMonth, startYear, endMonth, endYear, ongoing: isOngoing };
  }

  const parts = clean.split(/\s*[-–]\s*/);
  if (parts.length >= 2) {
    const parsePart = (p: string) => {
      const tokens = p.trim().split(/\s+/);
      return tokens.length === 1 ? { month: null, year: tokens[0] } : { month: tokens[0], year: tokens[1] };
    };
    const from = parsePart(parts[0]);
    const isOngoing = /present|presente/i.test(parts[1]);
    const to = isOngoing ? { month: null, year: null } : parsePart(parts[1]);
    return {
      startMonth: from.month,
      startYear: from.year,
      endMonth: to.month,
      endYear: to.year,
      ongoing: isOngoing,
    };
  }

  return { startMonth: null, startYear: null, endMonth: null, endYear: null, ongoing: false };
}

// ─── Extração de LayoutItems do PDF via pdf-parse ────────────────────────────

export async function extractLayoutItems(buffer: Buffer): Promise<LayoutItem[]> {
  const items: LayoutItem[] = [];

  async function pagerender(pageData: Record<string, unknown>) {
    const content = await (pageData["getTextContent"] as () => Promise<{
      items: Array<{ str?: string; height?: number; transform?: number[]; fontName?: string }>;
    }>)();
    for (const raw of content.items) {
      const text = normalizeText(raw.str ?? "");
      if (!text) continue;
      const h = (raw.height && raw.height > 0)
        ? raw.height
        : Math.abs(raw.transform?.[3] ?? 0);
      items.push({
        text,
        h: Math.round(h * 10) / 10,
        bold: /bold/i.test(raw.fontName ?? ""),
      });
    }
    return "";
  }

  await pdfParse(buffer, { pagerender });
  return items;
}

// ─── Divisão por Seções ──────────────────────────────────────────────────────

function splitIntoSections(items: LayoutItem[]): {
  personalInfo: LayoutItem[];
  sections: Map<string, LayoutItem[]>;
} {
  const filtered = items.filter((it) => it.h > 9.5); // Descarta "Page N of M"
  const sections = new Map<string, LayoutItem[]>();

  let currentSection = "unassigned";
  let currentItems: LayoutItem[] = [];

  for (const it of filtered) {
    const lo = it.text.toLowerCase();
    const isMain = it.h >= 14.5 && SECTION_MAIN_NAMES.has(lo);
    const isAux = it.h >= 12.4 && (SECTION_AUX_NAMES.has(lo) || SECTION_MAIN_NAMES.has(lo));

    if (isMain || isAux) {
      if (currentItems.length > 0) {
        sections.set(currentSection, currentItems);
      }
      currentSection = lo;
      currentItems = [];
    } else {
      currentItems.push(it);
    }
  }

  if (currentItems.length > 0) {
    sections.set(currentSection, currentItems);
  }

  const personalInfo: LayoutItem[] = [];
  const nameItem = filtered.find((it) => it.h >= 20);

  if (nameItem) {
    const nameIdx = filtered.indexOf(nameItem);
    for (let i = nameIdx; i < filtered.length; i++) {
      const it = filtered[i];
      if (it.h >= 14.5 && SECTION_MAIN_NAMES.has(it.text.toLowerCase())) break;
      personalInfo.push(it);
    }
  }

  return { personalInfo, sections };
}

// ─── Parsing de Experiências ─────────────────────────────────────────────────

function parseExperiencesFromSection(items: LayoutItem[]): ExperienceEntry[] {
  const results: ExperienceEntry[] = [];
  if (items.length === 0) return results;

  // Localizar índices com linhas de data
  const dateIndices: number[] = [];
  for (let idx = 0; idx < items.length; idx++) {
    if (IS_DATE_RE.test(items[idx].text)) {
      dateIndices.push(idx);
    }
  }

  for (let k = 0; k < dateIndices.length; k++) {
    const dateIdx = dateIndices[k];
    const dateItem = items[dateIdx];
    const nextDateIdx = k + 1 < dateIndices.length ? dateIndices[k + 1] : items.length;
    const prevBoundary = k === 0 ? 0 : dateIndices[k - 1];

    let company = "Experiência Profissional";
    let title: string | null = null;

    // Detectar Company e Title antes da data
    const availableBefore: LayoutItem[] = [];
    for (let b = dateIdx - 1; b >= prevBoundary; b--) {
      availableBefore.unshift(items[b]);
      if (availableBefore.length === 2) break;
    }

    if (availableBefore.length === 2) {
      company = availableBefore[0].text;
      title = availableBefore[1].text;
    } else if (availableBefore.length === 1) {
      company = availableBefore[0].text;
    }

    const dateParsed = parseDateString(dateItem.text);

    let contentStart = dateIdx + 1;
    if (contentStart < nextDateIdx && DURATION_ONLY_RE.test(items[contentStart].text)) {
      contentStart++;
    }

    let location: string | null = null;
    if (contentStart < nextDateIdx) {
      const cand = items[contentStart].text;
      if (cand.split(" ").length <= 5 && !/^\d/.test(cand) && !cand.startsWith("•") && !cand.includes(":")) {
        location = cand;
        contentStart++;
      }
    }

    let contentEnd = nextDateIdx;
    if (k + 1 < dateIndices.length) {
      if (nextDateIdx - 2 >= contentStart) {
        contentEnd = nextDateIdx - 2;
      } else if (nextDateIdx - 1 >= contentStart) {
        contentEnd = nextDateIdx - 1;
      }
    }

    const descLines: string[] = [];
    for (let c = contentStart; c < contentEnd; c++) {
      descLines.push(items[c].text);
    }

    results.push({
      company,
      title,
      ...dateParsed,
      location,
      description: descLines.join("\n").trim() || null,
    });
  }

  return results;
}

// ─── Parsing de Educação ─────────────────────────────────────────────────────

function parseEducationFromSection(items: LayoutItem[]): EducationEntry[] {
  const results: EducationEntry[] = [];
  let i = 0;

  while (i < items.length) {
    const school = items[i].text;
    let degree: string | null = null;
    let field: string | null = null;
    let dateParsed = {
      startMonth: null as string | null,
      startYear: null as string | null,
      endMonth: null as string | null,
      endYear: null as string | null,
      ongoing: false,
    };

    let j = i + 1;
    // O próximo item pode ser o grau/curso (ex: "Ensino Médio" ou "Curso, Tecnologia da Informação")
    if (j < items.length && !items[j].text.startsWith("·") && !IS_DATE_RE.test(items[j].text)) {
      const parts = items[j].text.split(",").map((s) => s.trim()).filter(Boolean);
      degree = parts[0] ?? null;
      field = parts.slice(1).join(", ") || null;
      j++;
    }

    // O item seguinte pode conter a data (ex: "· (February 2019 - December 2021)")
    if (j < items.length) {
      const candidate = items[j].text;
      if (IS_DATE_RE.test(candidate) || candidate.startsWith("·") || candidate.startsWith("(")) {
        dateParsed = parseDateString(candidate);
        j++;
      }
    }

    results.push({
      school,
      degree,
      field,
      ...dateParsed,
    });

    i = j;
  }

  return results;
}

// ─── Parser Principal ────────────────────────────────────────────────────────

export async function parseLinkedInPdf(buffer: Buffer): Promise<ParsedProfile> {
  const items = await extractLayoutItems(buffer);
  const { personalInfo, sections } = splitIntoSections(items);

  // Nome completo
  const nameItem = personalInfo.find((it) => it.h >= 20) ?? items.find((it) => it.h >= 20);
  const fullName = nameItem ? nameItem.text : null;

  // Headline / Título Profissional
  const nameIdx = nameItem ? personalInfo.indexOf(nameItem) : -1;
  let professionalTitle: string | null = null;
  if (nameIdx >= 0 && nameIdx + 1 < personalInfo.length) {
    const nextItem = personalInfo[nameIdx + 1];
    professionalTitle = nextItem.text;
    if (nameIdx + 2 < personalInfo.length && (personalInfo[nameIdx + 2].text.startsWith("&") || personalInfo[nameIdx + 2].text.startsWith("e "))) {
      professionalTitle = `${professionalTitle} ${personalInfo[nameIdx + 2].text}`;
    }
  }

  // Localização
  let location: string | null = null;
  if (nameIdx >= 0) {
    for (let p = nameIdx + 1; p < personalInfo.length; p++) {
      const cand = personalInfo[p].text;
      if (cand !== professionalTitle && !cand.startsWith("&") && cand.split(" ").length <= 4 && !cand.includes("|")) {
        location = cand;
        break;
      }
    }
  }

  // Telefone no Contato / Header
  const contactItems = sections.get("contact") ?? sections.get("contato") ?? [];
  const phone =
    [...contactItems, ...items].find((it) => PHONE_RE.test(it.text))?.text.replace(/\s*\(Mobile\)/i, "").trim() ?? null;

  // Resumo / Summary
  const summaryItems = sections.get("summary") ?? sections.get("sobre") ?? sections.get("resumo") ?? [];
  const summary = summaryItems.map((it) => it.text).join(" ").trim() || null;

  // Skills / Competências
  const skillItems = sections.get("top skills") ?? sections.get("skills") ?? sections.get("competências") ?? sections.get("habilidades") ?? [];
  const skills = skillItems
    .flatMap((it) => it.text.split(/[,;|•]/))
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length <= 80)
    .slice(0, 50);

  // Experiências
  const expItems = sections.get("experience") ?? sections.get("experiência") ?? sections.get("experiencia") ?? [];
  const experiences = parseExperiencesFromSection(expItems);

  // Educação / Formação
  const eduItems = sections.get("education") ?? sections.get("educação") ?? sections.get("formação") ?? sections.get("formacao") ?? [];
  const education = parseEducationFromSection(eduItems);

  return {
    fullName,
    professionalTitle,
    location,
    phone,
    summary,
    skills,
    experiences,
    education,
  };
}
