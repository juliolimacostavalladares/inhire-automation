import { http } from '@/lib/api/http'

export interface Tenant {
  id: string
  slug: string
  name: string
  logoUrl?: string | null
  origin: string
  active: boolean
  lastValidatedAt?: string | null
  lastCollectedAt?: string | null
  jobsCount?: number
  createdAt: string
  updatedAt: string
}

export interface TenantsQuery {
  page?: number
  limit?: number
  search?: string
  active?: boolean
}

export interface TenantsResponse {
  data: Tenant[]
  meta: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export async function listTenants(query: TenantsQuery = {}) {
  const { data } = await http.get<TenantsResponse>('/tenants', {
    params: { page: 1, limit: 12, active: true, ...query },
  })
  return data
}

export async function getTenant(idOrSlug: string) {
  const { data } = await http.get<Tenant>(`/tenants/${encodeURIComponent(idOrSlug)}`)
  return data
}
