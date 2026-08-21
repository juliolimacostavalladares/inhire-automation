import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Building2, Briefcase, ExternalLink, RotateCcw, Search, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CandidateTopbar } from '@/components/layout/candidate-topbar'
import { CompanyLogo } from '@/components/brand/company-logo'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { listTenants, type Tenant } from '@/features/tenants/tenants.api'

export function CompaniesSearchPage() {
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const limit = 12

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    const timer = setTimeout(() => {
      listTenants({
        page: currentPage,
        limit,
        search: search.trim() || undefined,
      })
        .then((res) => {
          if (!active) return
          setTenants(res.data)
          setTotal(res.meta.total)
          setPages(res.meta.pages)
          setLoading(false)
        })
        .catch(() => {
          if (!active) return
          setError('Não foi possível carregar as empresas no momento.')
          setLoading(false)
        })
    }, 300)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [search, currentPage])

  const handleSearchChange = (val: string) => {
    setSearch(val)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pages || page === currentPage) return
    setCurrentPage(page)
    window.scrollTo({ top: 350, behavior: 'smooth' })
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

  return (
    <div className="min-h-svh bg-canvas">
      <CandidateTopbar />

      {/* HERO SECTION */}
      <section className="relative border-b border-border/70 bg-gradient-to-b from-primary/10 via-card/50 to-canvas pt-12 pb-14 sm:pt-16 sm:pb-18 lg:pt-20 lg:pb-20">
        <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1 text-xs font-extrabold text-foreground shadow-2xs">
            <Building2 className="size-3.5 text-foreground" /> Empresas Verificadas
          </div>

          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Conheça as empresas contratando <span className="block mt-1 sm:mt-2 text-foreground">pela InHire</span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            Explore empresas em crescimento, descubra suas culturas e encontre vagas abertas diretamente em seus portais oficiais.
          </p>

          {/* FLOATING SEARCH BAR */}
          <div className="mx-auto mt-8 max-w-2xl">
            <div className="rounded-2xl sm:rounded-full border border-border/80 bg-card p-2 sm:p-2.5 shadow-lg shadow-foreground/[0.03] transition-all focus-within:border-foreground/30 focus-within:shadow-xl flex items-center gap-2">
              <div className="relative flex flex-1 items-center px-3 sm:px-4">
                <Search className="size-5 shrink-0 text-muted-foreground/70 mr-3" />
                <input
                  type="text"
                  className="h-11 sm:h-12 w-full bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground/70 outline-none"
                  placeholder="Buscar empresa por nome ou segmento..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  aria-label="Buscar empresa"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => handleSearchChange('')}
                    className="p-1 text-muted-foreground hover:text-foreground"
                    aria-label="Limpar busca"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              <Button
                type="button"
                className="h-11 sm:h-12 rounded-xl sm:rounded-full bg-primary px-6 text-sm font-extrabold text-primary-foreground shadow-xs hover:bg-primary/90 shrink-0"
              >
                Buscar
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN COMPANIES GRID */}
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              {search ? `Resultados para "${search}"` : 'Todas as empresas cadastradas'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Empresas integradas com vagas coletadas em tempo real.
            </p>
          </div>
          <span className="text-xs font-bold text-muted-foreground bg-card border border-border/80 rounded-full px-3 py-1.5 shadow-2xs w-fit">
            {loading ? 'Carregando…' : total ? `${total} empresas` : '0 empresas'}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-2xl border border-border bg-card/60 p-5 shadow-xs"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/30 bg-card p-10 text-center shadow-xs">
            <p className="text-base font-extrabold text-foreground">Não foi possível carregar as empresas</p>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <Button onClick={() => setCurrentPage(1)} className="mt-5">Tentar novamente</Button>
          </div>
        ) : tenants.length > 0 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
              {tenants.map((tenant) => {
                const initials = tenant.name.slice(0, 3).toUpperCase()
                return (
                  <Card
                    key={tenant.id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-start gap-4">
                        <CompanyLogo
                          logoUrl={tenant.logoUrl}
                          company={tenant.name}
                          initials={initials}
                          className="size-14 shrink-0 rounded-xl text-base shadow-2xs"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-extrabold text-foreground truncate group-hover:text-foreground">
                            {tenant.name}
                          </h3>
                          <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
                            <span className="inline-block size-2 rounded-full bg-emerald-500" />
                            Empresa ativa
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-bold text-foreground">
                          <Briefcase className="size-3 text-muted-foreground" />
                          {tenant.jobsCount !== undefined && tenant.jobsCount > 0
                            ? `${tenant.jobsCount} vagas abertas`
                            : 'Vagas disponíveis'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                      <Button asChild variant="ghost" size="sm" className="h-9 px-3 rounded-xl text-xs font-bold gap-1 text-foreground hover:bg-accent">
                        <Link to={`/empresas/${tenant.slug}`}>
                          Ver vagas abertas <ArrowRight className="size-3.5 text-foreground" />
                        </Link>
                      </Button>
                      <a
                        href={`https://${tenant.slug}.inhire.app`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                        title="Abrir portal oficial da empresa"
                        aria-label="Abrir portal oficial da empresa"
                      >
                        <ExternalLink className="size-4" />
                      </a>
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Pagination Controls */}
            {pages > 1 && (
              <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row">
                <p className="text-xs font-medium text-muted-foreground order-2 sm:order-1">
                  Mostrando <span className="font-bold text-foreground">{startRange}</span> a <span className="font-bold text-foreground">{endRange}</span> de <span className="font-bold text-foreground">{total}</span> empresas
                </p>

                <Pagination className="mx-0 w-auto order-1 sm:order-2">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        disabled={currentPage <= 1 || loading}
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
                            disabled={loading}
                            onClick={() => handlePageChange(pageItem)}
                          >
                            {pageItem}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    })}

                    <PaginationItem>
                      <PaginationNext
                        disabled={currentPage >= pages || loading}
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
            <Building2 className="mx-auto size-8 text-muted-foreground/60" />
            <p className="mt-4 text-base font-extrabold text-foreground">Nenhuma empresa encontrada</p>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              Não encontramos nenhuma empresa com os termos pesquisados. Tente buscar por outro nome.
            </p>
            {search && (
              <Button variant="outline" size="sm" onClick={() => handleSearchChange('')} className="mt-5 rounded-full">
                <RotateCcw className="mr-1.5 size-3.5" /> Limpar busca e ver todas
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
