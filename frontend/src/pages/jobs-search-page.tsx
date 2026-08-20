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

  const firstName = user?.name ? user.name.split(' ')[0] : null
  const greeting = firstName
    ? `Olá, ${firstName}! Vamos encontrar sua vaga? 🔥`
    : `Bem-vindo! Vamos encontrar sua vaga? 🔥`

  return (
    <div className="min-h-svh bg-canvas">
      <CandidateTopbar />

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        {/* Hero Greeting Section */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <span>{greeting}</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Explore oportunidades atualizadas em tempo real e gere currículos sob medida com IA.
          </p>
        </div>

        {/* Search & Control Bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Result Count Badge */}
          <div className="inline-flex items-center gap-2.5 rounded-full bg-foreground px-5 py-2.5 text-xs font-bold text-background shadow-xs shrink-0 self-start sm:self-auto">
            <span>Resultados da busca</span>
            <span className="h-3.5 w-px bg-background/25" />
            <span className="text-background/80 font-semibold">
              {loading ? 'Buscando…' : total ? `${total} vagas encontradas` : '0 vagas'}
            </span>
          </div>

          {/* Search Input Bar */}
          <div className="flex flex-1 items-center gap-3 max-w-xl sm:ml-auto">
            <div className="relative flex-1">
              <Input
                className="h-11 rounded-2xl border-border/80 bg-card pl-10 pr-4 text-sm shadow-2xs focus-visible:ring-primary"
                startIcon={<Search className="size-4 text-muted-foreground" />}
                placeholder="Buscar por cargo, empresa, tecnologia ou localização…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Buscar vagas"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="size-11 shrink-0 rounded-2xl border-border/80 bg-card shadow-2xs hover:bg-muted/60"
              aria-label="Filtrar vagas"
            >
              <SlidersHorizontal className="size-4" />
            </Button>
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="mb-8 flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filters.map((filter) => {
            const isActive = activeFilter === filter.id
            return (
              <Button
                key={filter.id}
                type="button"
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'h-9 rounded-full px-4 text-xs font-bold transition-all shadow-2xs',
                  isActive
                    ? 'bg-foreground text-background hover:bg-foreground/90'
                    : 'border-border/80 bg-card text-foreground hover:bg-muted/60',
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

        {/* Jobs Grid (2 Columns on Desktop) */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-56 animate-pulse rounded-3xl border border-border/60 bg-card/60 p-6"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-destructive/30 bg-card p-10 text-center shadow-xs" role="alert">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 pb-12">
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
          <div className="rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center">
            <Search className="mx-auto size-8 text-muted-foreground/60" />
            <p className="mt-4 text-base font-extrabold text-foreground">Nenhuma oportunidade encontrada</p>
            <p className="mt-2 text-sm text-muted-foreground">Tente alterar os termos da busca ou selecionar outro filtro.</p>
          </div>
        )}
      </main>
    </div>
  )
}
