import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Briefcase, Building2, ExternalLink, RotateCcw, Search, X } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CandidateTopbar } from '@/components/layout/candidate-topbar'
import { CompanyLogo } from '@/components/brand/company-logo'
import { Button } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { JobCard } from '@/features/jobs/job-card'
import { listJobs } from '@/features/jobs/jobs.api'
import type { Job } from '@/features/jobs/jobs.data'
import { getTenant, type Tenant } from '@/features/tenants/tenants.api'
import { useJobsStore } from '@/features/jobs/jobs.store'
import { cn } from '@/lib/utils'

type WorkplaceFilter = 'all' | 'Remote' | 'Hybrid' | 'On-site'

export function CompanyDetailsPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [tenantLoading, setTenantLoading] = useState(true)
  const [tenantError, setTenantError] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [workplaceType, setWorkplaceType] = useState<WorkplaceFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const [jobs, setJobs] = useState<Job[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [jobsLoading, setJobsLoading] = useState(true)

  const { favorites, toggleFavorite } = useJobsStore()
  const limit = 10

  // 1. Fetch Tenant details
  useEffect(() => {
    if (!slug) return
    let active = true
    setTenantLoading(true)
    setTenantError(null)

    getTenant(slug)
      .then((data) => {
        if (!active) return
        setTenant(data)
        setTenantLoading(false)
      })
      .catch(() => {
        if (!active) return
        setTenantError('Empresa não encontrada.')
        setTenantLoading(false)
      })

    return () => { active = false }
  }, [slug])

  // 2. Fetch Jobs for this tenant
  useEffect(() => {
    if (!slug) return
    let active = true
    setJobsLoading(true)

    const timer = setTimeout(() => {
      listJobs({
        tenantId: tenant?.id,
        tenantSlug: slug,
        page: currentPage,
        limit,
        title: query.trim() || undefined,
        workplaceType: workplaceType === 'all' ? undefined : workplaceType,
      })
        .then((res) => {
          if (!active) return
          setJobs(res.data)
          setTotal(res.meta.total)
          setPages(res.meta.pages)
          setJobsLoading(false)
        })
        .catch(() => {
          if (!active) return
          setJobs([])
          setTotal(0)
          setPages(1)
          setJobsLoading(false)
        })
    }, 300)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [slug, tenant?.id, query, workplaceType, currentPage])

  const handleQueryChange = (val: string) => {
    setQuery(val)
    setCurrentPage(1)
  }

  const handleWorkplaceChange = (type: WorkplaceFilter) => {
    setWorkplaceType(type)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pages || page === currentPage) return
    setCurrentPage(page)
    window.scrollTo({ top: 300, behavior: 'smooth' })
  }

  const paginationRange = useMemo(() => {
    if (pages <= 7) {
      return Array.from({ length: pages }, (_, i) => i + 1)
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, 'ellipsis', pages] as (number | 'ellipsis')[]
    }
    if (currentPage >= pages - 3) {
      return [1, 'ellipsis', pages - 4, pages - 3, pages - 2, pages - 1, pages] as (number | 'ellipsis')[]
    }
    return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', pages] as (number | 'ellipsis')[]
  }, [currentPage, pages])

  const startRange = total === 0 ? 0 : (currentPage - 1) * limit + 1
  const endRange = Math.min(currentPage * limit, total)

  if (tenantLoading) {
    return <main className="grid min-h-svh place-items-center bg-canvas text-sm text-muted-foreground">Carregando informações da empresa…</main>
  }

  if (tenantError || !tenant) {
    return (
      <main className="grid min-h-svh place-items-center bg-canvas p-6 text-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">EMPRESA NÃO ENCONTRADA</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Esta empresa não foi encontrada no InHire.</h1>
          <Button className="mt-6" onClick={() => navigate('/empresas')}>
            <ArrowLeft className="mr-2 size-4" /> Voltar para lista de empresas
          </Button>
        </div>
      </main>
    )
  }

  const initials = tenant.name.slice(0, 3).toUpperCase()

  return (
    <div className="min-h-svh bg-canvas">
      <CandidateTopbar />

      {/* COMPANY HEADER BANNER */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
          <Button asChild variant="ghost" size="sm" className="-ml-3 mb-6 gap-2 text-xs font-bold text-muted-foreground hover:text-foreground">
            <Link to="/empresas">
              <ArrowLeft className="size-4" /> Todas as empresas
            </Link>
          </Button>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-5">
              <CompanyLogo
                logoUrl={tenant.logoUrl}
                company={tenant.name}
                initials={initials}
                className="size-16 sm:size-20 shrink-0 rounded-2xl text-lg shadow-sm"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
                    {tenant.name}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-0.5 text-xs font-extrabold text-foreground">
                    <Building2 className="size-3 text-foreground" /> Verificada
                  </span>
                </div>

                <p className="mt-2 text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                  <Briefcase className="size-4" /> {total} {total === 1 ? 'oportunidade aberta' : 'oportunidades abertas'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button asChild variant="outline" className="rounded-xl gap-2 font-bold shadow-2xs">
                <a href={`https://${tenant.slug}.inhire.app`} target="_blank" rel="noreferrer">
                  Portal oficial da empresa <ExternalLink className="size-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* JOBS LIST FOR THIS COMPANY */}
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        {/* Search & Quick Filter Bar */}
        <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-9 text-sm text-foreground placeholder:text-muted-foreground shadow-xs outline-none focus:border-foreground/30 focus:ring-1 focus:ring-foreground/20"
              placeholder={`Buscar vaga em ${tenant.name}...`}
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              aria-label="Buscar vaga nesta empresa"
            />
            {query && (
              <button
                type="button"
                onClick={() => handleQueryChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                aria-label="Limpar busca"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Workplace Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                'h-9 rounded-full px-4 text-xs transition-all shadow-2xs',
                workplaceType === 'all'
                  ? 'bg-primary text-primary-foreground font-extrabold border-primary hover:bg-primary/90'
                  : 'border-border bg-card text-foreground font-semibold hover:border-foreground/30',
              )}
              onClick={() => handleWorkplaceChange('all')}
            >
              Todas ({total})
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                'h-9 rounded-full px-4 text-xs transition-all shadow-2xs',
                workplaceType === 'Remote'
                  ? 'bg-primary text-primary-foreground font-extrabold border-primary hover:bg-primary/90'
                  : 'border-border bg-card text-foreground font-semibold hover:border-foreground/30',
              )}
              onClick={() => handleWorkplaceChange('Remote')}
            >
              Remoto
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                'h-9 rounded-full px-4 text-xs transition-all shadow-2xs',
                workplaceType === 'Hybrid'
                  ? 'bg-primary text-primary-foreground font-extrabold border-primary hover:bg-primary/90'
                  : 'border-border bg-card text-foreground font-semibold hover:border-foreground/30',
              )}
              onClick={() => handleWorkplaceChange('Hybrid')}
            >
              Híbrido
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                'h-9 rounded-full px-4 text-xs transition-all shadow-2xs',
                workplaceType === 'On-site'
                  ? 'bg-primary text-primary-foreground font-extrabold border-primary hover:bg-primary/90'
                  : 'border-border bg-card text-foreground font-semibold hover:border-foreground/30',
              )}
              onClick={() => handleWorkplaceChange('On-site')}
            >
              Presencial
            </Button>
          </div>
        </div>

        {/* Jobs Grid */}
        {jobsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-2xl border border-border bg-card/60 p-5 shadow-xs"
              />
            ))}
          </div>
        ) : jobs.length > 0 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  favorite={favorites.has(job.id)}
                  onFavorite={() => toggleFavorite(job.id)}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {pages > 1 && (
              <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row">
                <p className="text-xs font-medium text-muted-foreground order-2 sm:order-1">
                  Mostrando <span className="font-bold text-foreground">{startRange}</span> a <span className="font-bold text-foreground">{endRange}</span> de <span className="font-bold text-foreground">{total}</span> vagas
                </p>

                <Pagination className="mx-0 w-auto order-1 sm:order-2">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        disabled={currentPage <= 1 || jobsLoading}
                        onClick={() => handlePageChange(currentPage - 1)}
                      />
                    </PaginationItem>

                    {paginationRange.map((pageItem, index) => {
                      if (pageItem === 'ellipsis') {
                        return (
                          <PaginationItem key={`ellipsis-${index}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )
                      }

                      return (
                        <PaginationItem key={pageItem}>
                          <PaginationLink
                            isActive={pageItem === currentPage}
                            disabled={jobsLoading}
                            onClick={() => handlePageChange(pageItem)}
                          >
                            {pageItem}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    })}

                    <PaginationItem>
                      <PaginationNext
                        disabled={currentPage >= pages || jobsLoading}
                        onClick={() => handlePageChange(currentPage + 1)}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center">
            <Search className="mx-auto size-8 text-muted-foreground/60" />
            <p className="mt-4 text-base font-extrabold text-foreground">Nenhuma vaga encontrada</p>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              Não encontramos vagas em {tenant.name} com os filtros selecionados.
            </p>
            {(query || workplaceType !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery('')
                  setWorkplaceType('all')
                  setCurrentPage(1)
                }}
                className="mt-5 rounded-full"
              >
                <RotateCcw className="mr-1.5 size-3.5" /> Limpar filtros e ver todas
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
