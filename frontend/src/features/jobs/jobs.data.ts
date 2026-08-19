export interface Job {
  id: string
  externalId?: string
  company: string
  initials: string
  title: string
  location: string
  workplace: 'Remoto' | 'Híbrido' | 'Presencial'
  seniority: string
  contract: string
  area: string
  publishedLabel: string
  recent: boolean
  description: string
  descriptionHtml?: string
  requirements: string[]
  url: string
  status?: 'PUBLISHED' | 'CLOSED'
}

export const jobs: Job[] = [
  {
    id: 'brq-fullstack',
    company: 'BRQ Digital Solutions',
    initials: 'BRQ',
    title: 'Desenvolvedor(a) Full Stack Java',
    location: 'Brasil',
    workplace: 'Remoto',
    seniority: 'Sênior',
    contract: 'Tempo integral',
    area: 'Tecnologia',
    publishedLabel: 'Publicada hoje',
    recent: true,
    description:
      'Buscamos uma pessoa para atuar em produtos digitais de alta escala, colaborando com um time multidisciplinar e participando das decisões técnicas do produto.',
    requirements: [
      'Experiência com Java, Quarkus ou Spring Boot',
      'Conhecimento em React ou Angular',
      'Boas práticas de testes e APIs REST',
    ],
    url: 'https://brq.inhire.app/vagas/8ca63801-4845-4e49-b744-2add7e08a23a/desenvolvedor-a-full-stack-java-angular-react-quarkus',
  },
  {
    id: 'finance-analyst',
    company: 'Finance Company',
    initials: 'FC',
    title: 'Analista Financeiro Sênior',
    location: 'São Paulo, SP',
    workplace: 'Híbrido',
    seniority: 'Sênior',
    contract: 'Tempo integral',
    area: 'Finanças',
    publishedLabel: 'Há 2 dias',
    recent: true,
    description:
      'Atuação próxima às áreas de negócio na construção de análises, projeções e indicadores para apoiar decisões financeiras estratégicas.',
    requirements: [
      'Experiência com planejamento financeiro',
      'Domínio de Excel e ferramentas de BI',
      'Boa comunicação com áreas de negócio',
    ],
    url: 'https://inhire.app',
  },
  {
    id: 'nubank-product-designer',
    company: 'Nubank',
    initials: 'NU',
    title: 'Product Designer Pleno',
    location: 'Brasil',
    workplace: 'Remoto',
    seniority: 'Pleno',
    contract: 'Tempo integral',
    area: 'Design',
    publishedLabel: 'Há 4 dias',
    recent: true,
    description:
      'Você vai transformar problemas complexos em experiências simples, inclusivas e consistentes para milhões de clientes.',
    requirements: [
      'Portfólio de produtos digitais',
      'Experiência com pesquisa e prototipação',
      'Conhecimento de design systems',
    ],
    url: 'https://inhire.app',
  },
  {
    id: 'avenue-operations',
    company: 'Avenue',
    initials: 'AV',
    title: 'Coordenador(a) de Operações',
    location: 'São Paulo, SP',
    workplace: 'Híbrido',
    seniority: 'Coordenação',
    contract: 'Tempo integral',
    area: 'Operações',
    publishedLabel: 'Há 1 semana',
    recent: true,
    description:
      'Liderança da rotina operacional e evolução dos processos, garantindo eficiência, qualidade e uma ótima experiência para clientes.',
    requirements: [
      'Experiência em gestão de operações',
      'Liderança de equipes multidisciplinares',
      'Visão analítica orientada a indicadores',
    ],
    url: 'https://inhire.app',
  },
  {
    id: 'people-rh',
    company: 'People Company',
    initials: 'PC',
    title: 'Especialista de Recursos Humanos',
    location: 'Campinas, SP',
    workplace: 'Presencial',
    seniority: 'Especialista',
    contract: 'Tempo integral',
    area: 'Recursos Humanos',
    publishedLabel: 'Há 3 semanas',
    recent: false,
    description:
      'Posição responsável por desenvolver iniciativas de pessoas, cultura e desenvolvimento organizacional junto às lideranças.',
    requirements: [
      'Experiência generalista em Recursos Humanos',
      'Conhecimento de indicadores de pessoas',
      'Facilidade para conduzir projetos',
    ],
    url: 'https://inhire.app',
  },
]
