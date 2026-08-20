import { useEffect, useMemo, useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CandidateTopbar } from '@/components/layout/candidate-topbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { JobCard } from '@/features/jobs/job-card'
import { useJobs } from '@/features/jobs/use-jobs'
import { useAuth } from '@/features/auth/use-auth'
import { cn } from '@/lib/utils'

type QuickFilter = 'recommended' | 'recent' | 'remote' | 'all'

const filters: Array<{ id: QuickFilter; label: string }> = [
  { id: 'recommended', label: 'Para você' },
  { id: 'recent', label: 'Últimas 2 semanas' },
  { id: 'remote', label: 'Remoto' },
  { id: 'all', label: 'Todas as áreas' },
]

export function JobsSearchPage() {
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<QuickFilter>('recommended')
  const [recentFrom] = useState(() => new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
  const { jobs, total, favorites, loading, error, fetchJobs, toggleFavorite } = useJobs()
  const { user } = useAuth()

  const request = useMemo(() => ({
    ...(activeFilter === 'recent'
      ? { firstSeenFrom: recentFrom }
      : {}),
    ...(activeFilter === 'remote' ? { workplaceType: 'Remote' } : {}),
    title: query.trim() || undefined,
  }), [activeFilter, query, recentFrom])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchJobs(request)
    }, 300)
    return () => window.clearTimeout(timeout)
  }, [fetchJobs, request])

  const filteredJobs = jobs

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
            Vagas verificadas e atualizadas diariamente.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="mb-5 flex items-center gap-3">
          <div className="relative flex-1">
            <Input
              className="h-12 rounded-xl border border-border bg-card pl-10 pr-4 text-sm shadow-xs focus-visible:ring-primary"
              startIcon={<Search className="size-4 text-muted-foreground" />}
              placeholder="Cargo, habilidade ou empresa"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
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
          {filters.map((filter) => {
            const isActive = activeFilter === filter.id
            return (
              <Button
                key={filter.id}
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  'h-8.5 rounded-full px-4 text-xs transition-all shadow-2xs',
                  isActive
                    ? 'bg-primary text-primary-foreground font-extrabold border-primary hover:bg-primary/90'
                    : 'border-border bg-card text-foreground font-semibold hover:border-foreground/30',
                  filter.id === 'recommended' && !user && 'hidden',
                )}
                aria-pressed={isActive}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </Button>
            )
          })}
        </div>

        {/* Section Header: Title + Counter */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold tracking-tight text-foreground">
            Vagas para você
          </h2>
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
        ) : filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12 items-stretch">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                favorite={favorites.has(job.id)}
                onFavorite={() => toggleFavorite(job.id)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center">
            <Search className="mx-auto size-8 text-muted-foreground/60" />
            <p className="mt-4 text-base font-extrabold text-foreground">Nenhuma oportunidade encontrada</p>
            <p className="mt-2 text-sm text-muted-foreground">Tente alterar os termos da busca ou selecionar outro filtro.</p>
          </div>
        )}
      </main>
    </div>
  )
}
