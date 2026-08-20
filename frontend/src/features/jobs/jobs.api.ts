import { http } from '@/lib/api/http'
import type { Job } from './jobs.data'

export interface JobsQuery {
  page?: number
  limit?: number
  title?: string
  workplaceType?: string
  location?: string
  status?: 'PUBLISHED' | 'CLOSED'
  firstSeenFrom?: string
  firstSeenTo?: string
  publishedFrom?: string
  publishedTo?: string
}

interface ApiTenant {
  id: string
  slug: string
  name: string
  logoUrl?: string | null
}

interface ApiJob {
  id: string
  externalId: string
  tenantId: string
  title: string
  workplaceType: string | null
  location: string | null
  sourceStatus: string | null
  url: string
  status: 'PUBLISHED' | 'CLOSED'
  publishedAt: string | null
  firstSeenAt: string
  lastSeenAt: string
  closedAt: string | null
  createdAt: string
  updatedAt: string
  detailFetchedAt?: string | null
  descriptionHtml?: string | null
  applicationForm?: unknown
  tenant: ApiTenant
}

export interface JobsResponse {
  data: ApiJob[]
  meta: { total: number; page: number; limit: number; pages: number }
}

function formatPublishedLabel(dateValue: string | null) {
  if (!dateValue) return 'Publicada recentemente'
  const date = new Date(dateValue)
  const today = new Date()
  if (date.toDateString() === today.toDateString()) return 'Publicada hoje'
  return `Publicada em ${new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date)}`
}

function workplaceLabel(value: string | null): Job['workplace'] {
  const normalized = value?.toLocaleLowerCase('pt-BR') ?? ''
  if (normalized.includes('remote') || normalized.includes('remoto')) return 'Remoto'
  if (normalized.includes('hybrid') || normalized.includes('híbrido')) return 'Híbrido'
  return 'Presencial'
}

function textFromHtml(value: string | null | undefined) {
  return value?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() ?? ''
}

export function mapApiJob(apiJob: ApiJob): Job {
  const firstSeen = new Date(apiJob.firstSeenAt)
  const recentLimit = Date.now() - 14 * 24 * 60 * 60 * 1000
  return {
    id: apiJob.id,
    externalId: apiJob.externalId,
    company: apiJob.tenant.name,
    logoUrl: apiJob.tenant.logoUrl ?? null,
    initials: apiJob.tenant.name.slice(0, 3).toUpperCase(),
    title: apiJob.title,
    location: apiJob.location ?? 'Brasil',
    workplace: workplaceLabel(apiJob.workplaceType),
    seniority: 'A definir',
    contract: 'Tempo integral',
    area: apiJob.tenant.name,
    publishedLabel: formatPublishedLabel(apiJob.publishedAt ?? apiJob.firstSeenAt),
    recent: firstSeen.getTime() >= recentLimit,
    description: textFromHtml(apiJob.descriptionHtml) || 'Confira os detalhes completos desta oportunidade na página oficial da InHire.',
    descriptionHtml: apiJob.descriptionHtml ?? undefined,
    requirements: [],
    url: apiJob.url,
    status: apiJob.status,
  }
}

export async function listJobs(query: JobsQuery = {}) {
  const { data } = await http.get<JobsResponse>('/jobs', { params: { page: 1, limit: 10, status: 'PUBLISHED', ...query } })
  return { ...data, data: data.data.map(mapApiJob) }
}

export async function getJob(id: string) {
  const { data } = await http.get<ApiJob>(`/jobs/${encodeURIComponent(id)}`)
  return mapApiJob(data)
}

export async function getApplicationForm(id: string) {
  const { data } = await http.get(`/jobs/${encodeURIComponent(id)}/application-form`)
  return data
}
