import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, BriefcaseBusiness, Search, SlidersHorizontal, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CandidateTopbar } from '@/components/layout/candidate-topbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { JobCard } from '@/features/jobs/job-card'
import { useJobs } from '@/features/jobs/use-jobs'
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
      <div>
        <main className="min-w-0">
          <div className="mx-auto w-full max-w-5xl px-5 py-7 sm:px-8 lg:px-9 lg:py-10 2xl:px-12">
            <section
              aria-labelledby="jobs-hero-title"
              className="relative isolate mb-5 overflow-hidden rounded-2xl border border-foreground/10 bg-foreground px-5 py-6 text-background shadow-sm sm:px-7 sm:py-8 lg:mb-7 lg:px-9 lg:py-9"
            >
              <div className="pointer-events-none absolute -right-10 -top-24 -z-10 size-64 rounded-full bg-secondary/35 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 left-1/3 -z-10 size-52 rounded-full bg-primary/20 blur-3xl" />
              <div className="pointer-events-none absolute right-8 top-8 -z-10 size-24 rounded-full border border-primary/30 sm:right-16 sm:size-36" />
              <div className="relative max-w-3xl">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                  <span className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Sparkles className="size-3.5" />
                  </span>
                  <span>InHire Hub · Portal de oportunidades</span>
                </div>
                <h1 id="jobs-hero-title" className="mt-5 max-w-2xl text-[2rem] font-extrabold leading-[1.02] tracking-[-0.045em] sm:text-4xl lg:text-[3.15rem]">
                  Seu próximo capítulo começa aqui.
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-6 text-background/70 sm:text-base">
                  Explore oportunidades em tecnologia, produto, operações, criação e muito mais — com espaço para encontrar o trabalho que combina com você.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-bold">
                  <span className="inline-flex items-center gap-2 rounded-full border border-background/15 bg-background/10 px-3 py-2">
                    <BriefcaseBusiness className="size-3.5 text-primary" /> Vagas atualizadas todos os dias
                  </span>
                  <span className="inline-flex items-center gap-1 text-background/65">
                    Comece sua busca <ArrowUpRight className="size-3.5" />
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-5 sm:p-7 lg:border-0 lg:bg-transparent lg:p-0">
              <div className="max-w-2xl">
                <p className="text-eyebrow">BUSCAR VAGAS</p>
                <p className="mt-2 text-sm font-bold text-foreground sm:text-base">Encontre uma oportunidade para o seu próximo passo.</p>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Input
                  className="flex-1 bg-background"
                  startIcon={<Search />}
                  placeholder="Cargo, empresa, área ou localização"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  aria-label="Buscar vagas"
                />
                <Button size="lg" className="sm:hidden">
                  <Search /> Buscar vagas
                </Button>
                <Button size="lg" variant="outline" className="hidden px-5 sm:inline-flex">
                  <SlidersHorizontal /> Filtros
                </Button>
              </div>
            </section>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {filters.map((filter) => (
                <Button
                  key={filter.id}
                  type="button"
                  size="pill"
                  variant={activeFilter === filter.id ? 'default' : 'outline'}
                  className={cn('h-9 px-4 text-xs', filter.id === 'recommended' && 'max-sm:hidden')}
                  aria-pressed={activeFilter === filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>

            <div className="mb-4 mt-7 flex items-end justify-between">
              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.025em]">Vagas recomendadas</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {loading ? 'Carregando oportunidades…' : total ? `${total} oportunidades encontradas` : 'Nenhuma oportunidade encontrada'}
                </p>
              </div>
              <button type="button" className="hidden text-xs font-extrabold text-foreground hover:underline sm:block">
                Mais recentes
              </button>
            </div>

            {loading ? (
              <div className="rounded-xl border border-border bg-card px-6 py-14 text-center" role="status">
                <p className="font-extrabold">Carregando vagas…</p>
              </div>
            ) : error ? (
              <div className="rounded-xl border border-destructive/40 bg-card px-6 py-14 text-center" role="alert">
                <p className="font-extrabold">Não foi possível carregar as vagas</p>
                <p className="mt-2 text-sm text-muted-foreground">{error}</p>
                {error.includes('login') && <Button asChild variant="link" className="mt-2"><Link to="/login">Entrar para continuar</Link></Button>}
                <Button className="mt-5" onClick={() => void fetchJobs(request)}>Tentar novamente</Button>
              </div>
            ) : filteredJobs.length > 0 ? (
              <div className="space-y-3 pb-10">
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
              <div className="rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
                <Search className="mx-auto size-6 text-muted-foreground" />
                <p className="mt-4 font-extrabold">Nenhuma vaga encontrada</p>
                <p className="mt-2 text-sm text-muted-foreground">Tente buscar por outro termo ou remover o filtro atual.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
