import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Search, SlidersHorizontal, Sparkles, UserCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CandidateTopbar } from '@/components/layout/candidate-topbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { useJobsStore } from '@/features/jobs/jobs.store'
import { useAuth } from '@/features/auth/use-auth'
import { cn } from '@/lib/utils'

type QuickFilter = 'recommended' | 'recent' | 'remote' | 'tech' | 'health' | 'finance' | 'all'

export function JobsSearchPage() {
  const [query, setQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [activeFilter, setActiveFilter] = useState<QuickFilter>('recommended')
  const [recentFrom] = useState(() => new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
  const { jobs, total, pages, limit, candidateArea, profileComplete, favorites, loading, error, fetchJobs, toggleFavorite } = useJobsStore()
  const { user } = useAuth()

  const request = useMemo(() => ({
    page: currentPage,
    limit: 10,
    ...(activeFilter === 'recent' ? { firstSeenFrom: recentFrom } : {}),
    ...(activeFilter === 'remote' ? { workplaceType: 'Remote' } : {}),
    ...(activeFilter === 'tech' ? { area: 'Tecnologia' } : {}),
    ...(activeFilter === 'health' ? { area: 'Saúde e Medicina' } : {}),
    ...(activeFilter === 'finance' ? { area: 'Finanças' } : {}),
    ...(activeFilter === 'recommended' && candidateArea ? { area: candidateArea } : {}),
    title: query.trim() || undefined,
  }), [activeFilter, query, recentFrom, candidateArea, currentPage])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchJobs(request)
    }, 300)
    return () => window.clearTimeout(timeout)
  }, [fetchJobs, request])

  const handleQueryChange = (val: string) => {
    setQuery(val)
    setCurrentPage(1)
  }

  const handleFilterChange = (filter: QuickFilter) => {
    setActiveFilter(filter)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pages || page === currentPage) return
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        {/* Title Header matching InHire design prototype */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Encontre sua próxima oportunidade
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Vagas verificadas e atualizadas diariamente com base na sua área de atuação.
          </p>
        </div>

        {/* Profile Onboarding CTA if profile is not completed */}
        {user && profileComplete === false && (
          <Card className="mb-8 overflow-hidden rounded-2xl border-primary/40 bg-gradient-to-r from-accent/40 via-card to-card p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3.5">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground font-black shadow-xs">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-foreground">
                    Complete seu perfil profissional com IA
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground max-w-xl leading-relaxed">
                    Envie seu currículo ou PDF do LinkedIn para que nossa IA identifique sua área de atuação e filtre automaticamente as vagas ideais para o seu perfil.
                  </p>
                </div>
              </div>
              <Button asChild className="shrink-0 rounded-xl bg-primary text-primary-foreground font-bold shadow-xs hover:bg-primary/90">
                <Link to="/onboarding/perfil" className="flex items-center gap-2">
                  Montar meu perfil agora <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </Card>
        )}

        {/* Search & Filter Bar */}
        <div className="mb-5 flex items-center gap-3">
          <div className="relative flex-1">
            <Input
              className="h-12 rounded-xl border border-border bg-card pl-10 pr-4 text-sm shadow-xs focus-visible:ring-primary"
              startIcon={<Search className="size-4 text-muted-foreground" />}
              placeholder="Cargo, habilidade ou empresa"
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              aria-label="Buscar vagas"
            />
          </div>
          <Button
            className="h-12 rounded-xl bg-primary px-5 font-bold text-primary-foreground shadow-xs hover:bg-primary/90 shrink-0 flex items-center gap-2"
            aria-label="Filtrar vagas"
          >
            <SlidersHorizontal className="size-4" />
            <span className="hidden sm:inline">Filtros</span>
          </Button>
        </div>

        {/* Quick Filter Chips */}
        <div className="mb-8 flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {user && candidateArea && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                'h-8.5 rounded-full px-4 text-xs transition-all shadow-2xs',
                activeFilter === 'recommended'
                  ? 'bg-primary text-primary-foreground font-extrabold border-primary hover:bg-primary/90'
                  : 'border-border bg-card text-foreground font-semibold hover:border-foreground/30',
              )}
              aria-pressed={activeFilter === 'recommended'}
              onClick={() => handleFilterChange('recommended')}
            >
              <UserCheck className="mr-1.5 size-3.5" />
              Para você ({candidateArea})
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              'h-8.5 rounded-full px-4 text-xs transition-all shadow-2xs',
              activeFilter === 'recent'
                ? 'bg-primary text-primary-foreground font-extrabold border-primary hover:bg-primary/90'
                : 'border-border bg-card text-foreground font-semibold hover:border-foreground/30',
            )}
            aria-pressed={activeFilter === 'recent'}
            onClick={() => handleFilterChange('recent')}
          >
            Últimas 2 semanas
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              'h-8.5 rounded-full px-4 text-xs transition-all shadow-2xs',
              activeFilter === 'remote'
                ? 'bg-primary text-primary-foreground font-extrabold border-primary hover:bg-primary/90'
                : 'border-border bg-card text-foreground font-semibold hover:border-foreground/30',
            )}
            aria-pressed={activeFilter === 'remote'}
            onClick={() => handleFilterChange('remote')}
          >
            Remoto
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              'h-8.5 rounded-full px-4 text-xs transition-all shadow-2xs',
              activeFilter === 'all'
                ? 'bg-primary text-primary-foreground font-extrabold border-primary hover:bg-primary/90'
                : 'border-border bg-card text-foreground font-semibold hover:border-foreground/30',
            )}
            aria-pressed={activeFilter === 'all'}
            onClick={() => handleFilterChange('all')}
          >
            Todas as áreas
          </Button>
        </div>

        {/* Section Header: Title + Counter */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-foreground">
              {candidateArea && activeFilter === 'recommended'
                ? `Vagas em ${candidateArea}`
                : 'Vagas para você'}
            </h2>
            {candidateArea && activeFilter === 'recommended' && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Filtradas com base na área profissional do seu currículo.
              </p>
            )}
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            {loading ? 'Carregando…' : total ? `${total} oportunidades` : '0 oportunidades'}
          </span>
        </div>

        {/* Jobs Grid (2 Columns on Desktop) */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-2xl border border-border bg-card/60 p-5"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/30 bg-card p-10 text-center shadow-xs" role="alert">
            <p className="text-base font-extrabold text-foreground">Não foi possível carregar as vagas</p>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            {error.includes('login') && (
              <Button asChild variant="link" className="mt-2">
                <Link to="/login">Entrar para continuar</Link>
              </Button>
            )}
            <div className="mt-5">
              <Button onClick={() => void fetchJobs(request)}>Tentar novamente</Button>
            </div>
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
            <Search className="mx-auto size-8 text-muted-foreground/60" />
            <p className="mt-4 text-base font-extrabold text-foreground">Nenhuma oportunidade encontrada</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {candidateArea
                ? `Não encontramos vagas abertas no momento para a área "${candidateArea}". Você pode buscar em todas as áreas ou ajustar os termos.`
                : 'Tente alterar os termos da busca ou selecionar outro filtro.'}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
