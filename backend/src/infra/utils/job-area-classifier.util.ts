export enum CanonicalArea {
  TECNOLOGIA = 'Tecnologia',
  SAUDE = 'Saúde e Medicina',
  FINANCAS = 'Finanças e Contabilidade',
  DESIGN = 'Design e Produto',
  RH = 'Recursos Humanos',
  VENDAS = 'Comercial e Vendas',
  MARKETING = 'Marketing e Comunicação',
  OPERACOES = 'Operações e Logística',
  JURIDICO = 'Jurídico e Compliance',
  GERAL = 'Geral',
}

const AREA_KEYWORDS: Record<CanonicalArea, string[]> = {
  [CanonicalArea.TECNOLOGIA]: [
    'desenvolvedor',
    'desenvolvedora',
    'developer',
    'dev',
    'programador',
    'programadora',
    'software',
    'fullstack',
    'full stack',
    'full-stack',
    'frontend',
    'front end',
    'front-end',
    'backend',
    'back end',
    'back-end',
    'mobile',
    'android',
    'ios',
    'flutter',
    'react native',
    'devops',
    'tech lead',
    'arquiteto de software',
    'engenheiro de software',
    'engenheira de software',
    'engenharia de software',
    'qa',
    'quality assurance',
    'teste',
    'testes',
    'tester',
    'dados',
    'data engineer',
    'data scientist',
    'dba',
    'cloud',
    'sre',
    'segurança da informação',
    'cybersecurity',
    'analista de sistemas',
    'scrum master',
    'product owner',
    'tecnologia',
    'computação',
    'infraestrutura ti',
    'java',
    'python',
    'react',
    'angular',
    'vue',
    'golang',
    'rust',
    'node',
    'typescript',
    'javascript',
    'php',
    'kotlin',
  ],
  [CanonicalArea.SAUDE]: [
    'médico',
    'médica',
    'medico',
    'medica',
    'enfermeiro',
    'enfermeira',
    'enfermagem',
    'farmacêutico',
    'farmaceutico',
    'farmacêutica',
    'farmaceutica',
    'psicólogo',
    'psicóloga',
    'psicologo',
    'psicologa',
    'fisioterapeuta',
    'nutricionista',
    'biomédico',
    'biomedico',
    'dentista',
    'odontólogo',
    'odontologo',
    'terapeuta',
    'hospitalar',
    'clínico',
    'clinico',
    'saúde',
    'saude',
    'medicina',
    'sanitário',
    'ambulatorial',
    'uti',
    'radiologista',
    'cirurgião',
  ],
  [CanonicalArea.FINANCAS]: [
    'financeiro',
    'financeira',
    'finanças',
    'financas',
    'contábil',
    'contabil',
    'contador',
    'contadora',
    'controller',
    'controladoria',
    'tesouraria',
    'auditor',
    'auditora',
    'auditoria',
    'fiscal',
    'custos',
    'crédito',
    'credito',
    'cobrança',
    'cobranca',
    'planejamento financeiro',
    'fp&a',
    'investimentos',
  ],
  [CanonicalArea.DESIGN]: [
    'designer',
    'design',
    'ux',
    'ui',
    'product designer',
    'design lead',
    'design system',
    'motion designer',
    'diretor de arte',
    'diretora de arte',
    'ilustrador',
    'ux writer',
    'visual designer',
    'product manager',
  ],
  [CanonicalArea.RH]: [
    'recursos humanos',
    'recrutamento',
    'recrutador',
    'recrutadora',
    'recruiter',
    'seleção',
    'selecao',
    'talent acquisition',
    'people',
    'gente e gestão',
    'gestão de pessoas',
    'departamento pessoal',
    'business partner',
    'remuneração',
    'treinamento',
  ],
  [CanonicalArea.VENDAS]: [
    'comercial',
    'vendas',
    'vendedor',
    'vendedora',
    'executivo de vendas',
    'executivo de contas',
    'account executive',
    'sdr',
    'bdr',
    'inside sales',
    'prospecção',
    'consultor de vendas',
    'consultora de vendas',
    'closer',
    'trade marketing',
  ],
  [CanonicalArea.MARKETING]: [
    'marketing',
    'growth',
    'social media',
    'conteúdo',
    'conteudo',
    'redator',
    'redatora',
    'copywriter',
    'tráfego pago',
    'trafego',
    'seo',
    'comunicação',
    'comunicacao',
    'publicidade',
    'branding',
    'assessoria de imprensa',
    'inbound',
    'crm',
  ],
  [CanonicalArea.OPERACOES]: [
    'operações',
    'operacoes',
    'operacional',
    'logística',
    'logistica',
    'supply chain',
    'estoque',
    'expedição',
    'expedicao',
    'compras',
    'facilities',
    'administrativo',
    'assistente administrativo',
    'auxiliar administrativo',
    'atendimento ao cliente',
    'customer experience',
    'suporte ao cliente',
  ],
  [CanonicalArea.JURIDICO]: [
    'jurídico',
    'juridico',
    'advogado',
    'advogada',
    'compliance',
    'dpo',
    'lgpd',
    'legal',
    'contencioso',
    'societário',
    'contratos',
  ],
  [CanonicalArea.GERAL]: [],
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function textMatchesKeyword(normalizedText: string, normalizedKeyword: string): boolean {
  if (!normalizedText || !normalizedKeyword) return false;
  if (normalizedKeyword.includes(' ')) {
    return normalizedText.includes(normalizedKeyword);
  }
  const words = normalizedText.split(' ');
  return words.some((word) => {
    if (word === normalizedKeyword) return true;
    if (normalizedKeyword.length >= 6 && word.startsWith(normalizedKeyword.slice(0, 6))) {
      return true;
    }
    return false;
  });
}

export function detectJobArea(title: string, descriptionHtml?: string | null): CanonicalArea {
  const normalizedTitle = normalizeText(title);
  const normalizedDesc = descriptionHtml ? normalizeText(descriptionHtml) : '';

  for (const [area, keywords] of Object.entries(AREA_KEYWORDS) as [CanonicalArea, string[]][]) {
    if (area === CanonicalArea.GERAL) continue;
    for (const keyword of keywords) {
      const normalizedKeyword = normalizeText(keyword);
      if (textMatchesKeyword(normalizedTitle, normalizedKeyword)) {
        return area;
      }
    }
  }

  if (normalizedDesc) {
    for (const [area, keywords] of Object.entries(AREA_KEYWORDS) as [CanonicalArea, string[]][]) {
      if (area === CanonicalArea.GERAL) continue;
      for (const keyword of keywords) {
        const normalizedKeyword = normalizeText(keyword);
        if (textMatchesKeyword(normalizedDesc, normalizedKeyword)) {
          return area;
        }
      }
    }
  }

  return CanonicalArea.GERAL;
}

export function getAreaKeywords(targetAreaOrTitle: string): string[] {
  const normalized = normalizeText(targetAreaOrTitle);
  if (!normalized) return [];

  for (const [area, keywords] of Object.entries(AREA_KEYWORDS) as [CanonicalArea, string[]][]) {
    if (area === CanonicalArea.GERAL) continue;
    const normalizedArea = normalizeText(area);
    if (normalized.includes(normalizedArea) || normalizedArea.includes(normalized)) {
      return keywords;
    }
  }

  for (const [area, keywords] of Object.entries(AREA_KEYWORDS) as [CanonicalArea, string[]][]) {
    if (area === CanonicalArea.GERAL) continue;
    for (const keyword of keywords) {
      if (textMatchesKeyword(normalized, normalizeText(keyword))) {
        return keywords;
      }
    }
  }

  return [];
}

export function matchesArea(jobTitle: string, targetAreaOrTitle: string): boolean {
  if (!targetAreaOrTitle || !targetAreaOrTitle.trim()) return true;
  const keywords = getAreaKeywords(targetAreaOrTitle);
  if (keywords.length === 0) return true;

  const normalizedTitle = normalizeText(jobTitle);
  return keywords.some((keyword) => textMatchesKeyword(normalizedTitle, normalizeText(keyword)));
}
