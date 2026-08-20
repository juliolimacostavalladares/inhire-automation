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
    'developer',
    'dev',
    'programador',
    'software',
    'fullstack',
    'frontend',
    'backend',
    'mobile',
    'android',
    'ios',
    'flutter',
    'react',
    'devops',
    'tech lead',
    'arquiteto',
    'qa',
    'tester',
    'dados',
    'data',
    'cloud',
    'sre',
    'seguranca',
    'cybersecurity',
    'java',
    'python',
    'node',
    'typescript',
  ]

  const healthKeywords = [
    'medico',
    'enfermeir',
    'farmaceutic',
    'psicolog',
    'fisioterapeut',
    'nutricionist',
    'biomedic',
    'dentista',
    'hospital',
    'saude',
    'clinico',
    'uti',
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
    'investimento',
  ]

  const designKeywords = [
    'designer',
    'design',
    'ux',
    'ui',
    'product design',
    'motion',
    'arte',
    'product manager',
  ]

  const hrKeywords = [
    'recursos humanos',
    'rh',
    'recrutamento',
    'recrutador',
    'recruiter',
    'selecao',
    'people',
    'gente',
    'departamento pessoal',
  ]

  const salesKeywords = [
    'comercial',
    'vendas',
    'vendedor',
    'account executive',
    'sdr',
    'bdr',
    'inside sales',
    'prospeccao',
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
  ]

  for (const kw of techKeywords) {
    if (normalized.includes(kw)) return 'Tecnologia'
  }
  for (const kw of healthKeywords) {
    if (normalized.includes(kw)) return 'Saúde e Medicina'
  }
  for (const kw of financeKeywords) {
    if (normalized.includes(kw)) return 'Finanças'
  }
  for (const kw of designKeywords) {
    if (normalized.includes(kw)) return 'Design'
  }
  for (const kw of hrKeywords) {
    if (normalized.includes(kw)) return 'Recursos Humanos'
  }
  for (const kw of salesKeywords) {
    if (normalized.includes(kw)) return 'Comercial e Vendas'
  }
  for (const kw of marketingKeywords) {
    if (normalized.includes(kw)) return 'Marketing'
  }

  return 'Tecnologia'
}
