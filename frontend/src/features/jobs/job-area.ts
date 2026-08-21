export function detectJobAreaFromTitle(title: string): string {
  const normalized = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const techKeywords = [
    'desenvolvedor',
    'desenvolvedora',
    'developer',
    'programador',
    'programadora',
    'software engineer',
    'engenheiro de software',
    'engenheira de software',
    'engenharia de software',
    'fullstack',
    'full stack',
    'frontend',
    'front end',
    'backend',
    'back end',
    'tech lead',
    'arquiteto de software',
    'devops',
    'qa engineer',
    'analista de qa',
    'engenheiro de dados',
    'data engineer',
    'cientista de dados',
    'data scientist',
    'react',
    'angular',
    'vue',
    'node',
    'typescript',
    'javascript',
    'python',
    'java',
    'golang',
    'kotlin',
    'flutter',
    'swift',
    'mobile developer',
    'web developer',
  ]

  const healthKeywords = [
    'medico',
    'medica',
    'enfermeir',
    'farmaceutic',
    'psicolog',
    'fisioterapeut',
    'nutricionist',
    'biomedic',
    'dentista',
    'odontolog',
    'hospitalar',
    'saude',
    'clinico',
    'uti',
    'cirurgiao',
  ]

  const financeKeywords = [
    'financeir',
    'financas',
    'contabil',
    'contador',
    'controller',
    'tesouraria',
    'auditor',
    'fiscal',
    'credito',
    'cobranca',
    'investimento',
  ]

  const designKeywords = [
    'designer',
    'design',
    'ux',
    'ui',
    'product design',
    'motion designer',
    'diretor de arte',
    'ilustrador',
    'product manager',
  ]

  const hrKeywords = [
    'recursos humanos',
    'recrutamento',
    'recrutador',
    'recrutadora',
    'recruiter',
    'selecao',
    'people',
    'gente e gestao',
    'departamento pessoal',
  ]

  const salesKeywords = [
    'executivo de negocios',
    'executivo de contas',
    'executivo de vendas',
    'comercial',
    'vendas',
    'vendedor',
    'vendedora',
    'account executive',
    'sdr',
    'bdr',
    'inside sales',
    'prospeccao',
    'consultor de vendas',
  ]

  const marketingKeywords = [
    'marketing',
    'growth',
    'social media',
    'conteudo',
    'redator',
    'copywriter',
    'trafego',
    'seo',
    'comunicacao',
    'publicidade',
    'branding',
  ]

  const operationsKeywords = [
    'vigia',
    'vigilante',
    'porteiro',
    'portaria',
    'seguranca patrimonial',
    'aeroportuario',
    'auxiliar de servicos',
    'servicos gerais',
    'limpeza',
    'motorista',
    'operacoes',
    'operacional',
    'logistica',
    'supply chain',
    'estoque',
    'expedicao',
    'administrativo',
  ]

  const words = normalized.split(' ')

  for (const kw of salesKeywords) {
    if (kw.includes(' ') && normalized.includes(kw)) return 'Comercial e Vendas'
    if (words.some((w) => w === kw || (kw.length >= 6 && w.startsWith(kw.slice(0, 6))))) return 'Comercial e Vendas'
  }

  for (const kw of operationsKeywords) {
    if (kw.includes(' ') && normalized.includes(kw)) return 'Operações e Serviços'
    if (words.some((w) => w === kw || (kw.length >= 6 && w.startsWith(kw.slice(0, 6))))) return 'Operações e Serviços'
  }

  for (const kw of techKeywords) {
    if (kw.includes(' ') && normalized.includes(kw)) return 'Tecnologia'
    if (words.some((w) => w === kw || (kw.length >= 6 && w.startsWith(kw.slice(0, 6))))) return 'Tecnologia'
  }

  for (const kw of healthKeywords) {
    if (kw.includes(' ') && normalized.includes(kw)) return 'Saúde e Medicina'
    if (words.some((w) => w === kw || (kw.length >= 6 && w.startsWith(kw.slice(0, 6))))) return 'Saúde e Medicina'
  }

  for (const kw of financeKeywords) {
    if (kw.includes(' ') && normalized.includes(kw)) return 'Finanças'
    if (words.some((w) => w === kw || (kw.length >= 6 && w.startsWith(kw.slice(0, 6))))) return 'Finanças'
  }

  for (const kw of designKeywords) {
    if (kw.includes(' ') && normalized.includes(kw)) return 'Design'
    if (words.some((w) => w === kw || (kw.length >= 6 && w.startsWith(kw.slice(0, 6))))) return 'Design'
  }

  for (const kw of hrKeywords) {
    if (kw.includes(' ') && normalized.includes(kw)) return 'Recursos Humanos'
    if (words.some((w) => w === kw || (kw.length >= 6 && w.startsWith(kw.slice(0, 6))))) return 'Recursos Humanos'
  }

  for (const kw of marketingKeywords) {
    if (kw.includes(' ') && normalized.includes(kw)) return 'Marketing'
    if (words.some((w) => w === kw || (kw.length >= 6 && w.startsWith(kw.slice(0, 6))))) return 'Marketing'
  }

  return 'Geral'
}
