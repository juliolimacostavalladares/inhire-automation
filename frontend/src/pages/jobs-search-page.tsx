import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  ChevronDown,
  Clock,
  Briefcase,
  Layers,
  MapPin,
  RotateCcw,
  Search,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { CandidateTopbar } from '@/components/layout/candidate-topbar'
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
import { JobCard } from '@/features/jobs/job-card'
import { useJobsStore } from '@/features/jobs/jobs.store'
import { useAuth } from '@/features/auth/use-auth'
import { cn } from '@/lib/utils'

type WorkplaceFilter = 'all' | 'Remote' | 'Hybrid' | 'On-site'
type DateFilter = 'all' | 'recent' | 'month'

export function JobsSearchPage() {
  const [keyword, setKeyword] = useState('')
  const [locationInput, setLocationInput] = useState('')
  const [workplaceType, setWorkplaceType] = useState<WorkplaceFilter>('all')
  const [selectedArea, setSelectedArea] = useState<string>('recommended')
  const [publishedDate, setPublishedDate] = useState<DateFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [recentFrom] = useState(() => new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
  const [monthFrom] = useState(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  // Dropdown open states
  const [openDropdown, setOpenDropdown] = useState<'workplace' | 'area' | 'date' | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { jobs, total, pages, limit, candidateArea, profileComplete, favorites, loading, error, fetchJobs, toggleFavorite } = useJobsStore()
  const { user } = useAuth()

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Build request payload
  const request = useMemo(() => {
    const fromDate =
      publishedDate === 'recent'
        ? recentFrom
        : publishedDate === 'month'
          ? monthFrom
          : undefined

    const hasSearchKeyword = Boolean(keyword.trim())

    return {
      page: currentPage,
      limit: 10,
      title: keyword.trim() || undefined,
      location: locationInput.trim() || undefined,
      workplaceType: workplaceType === 'all' ? undefined : workplaceType,
      area:
        hasSearchKeyword
          ? (selectedArea !== 'recommended' && selectedArea !== 'all' ? selectedArea : undefined)
          : (selectedArea === 'recommended' && candidateArea ? candidateArea : selectedArea === 'all' ? undefined : selectedArea),
      firstSeenFrom: fromDate,
      publishedFrom: fromDate,
    }
  }, [keyword, locationInput, workplaceType, selectedArea, candidateArea, publishedDate, currentPage, recentFrom, monthFrom])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchJobs(request)
    }, 300)
    return () => window.clearTimeout(timeout)
  }, [fetchJobs, request])

  const handleKeywordChange = (val: string) => {
    setKeyword(val)
    setCurrentPage(1)
  }

  const handleLocationChange = (val: string) => {
    setLocationInput(val)
    setCurrentPage(1)
  }

  const handleWorkplaceChange = (type: WorkplaceFilter) => {
    setWorkplaceType(type)
    setOpenDropdown(null)
    setCurrentPage(1)
  }

  const handleAreaChange = (area: string) => {
    setSelectedArea(area)
    setOpenDropdown(null)
    setCurrentPage(1)
  }

  const handleDateChange = (date: DateFilter) => {
    setPublishedDate(date)
    setOpenDropdown(null)
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setKeyword('')
    setLocationInput('')
    setWorkplaceType('all')
    setSelectedArea('all')
    setPublishedDate('all')
    setCurrentPage(1)
    setOpenDropdown(null)
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pages || page === currentPage) return
    setCurrentPage(page)
    window.scrollTo({ top: 400, behavior: 'smooth' })
  }

  const hasActiveFilters =
    Boolean(keyword.trim()) ||
    Boolean(locationInput.trim()) ||
    workplaceType !== 'all' ||
    selectedArea !== 'all' ||
    publishedDate !== 'all'

  const paginationRange = useMemo(() => {
    if (pages <= 5) {
      return Array.from({ length: pages }, (_, i) => i + 1)
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, 'ellipsis', pages] as (number | 'ellipsis')[]
    }

    if (currentPage >= pages - 2) {
      return [1, 'ellipsis', pages - 3, pages - 2, pages - 1, pages] as (number | 'ellipsis')[]
    }

    return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', pages] as (number | 'ellipsis')[]
  }, [currentPage, pages])

  const startRange = total === 0 ? 0 : (currentPage - 1) * limit + 1
  const endRange = Math.min(currentPage * limit, total)

  const workplaceLabels: Record<WorkplaceFilter, string> = {
    all: 'Tipo de vaga',
    Remote: 'Remoto',
    Hybrid: 'Híbrido',
    'On-site': 'Presencial',
  }

  const dateLabels: Record<DateFilter, string> = {
    all: 'Data de publicação',
    recent: 'Últimas 2 semanas',
    month: 'Últimos 30 dias',
  }

  const areaOptions = [
    ...(user && candidateArea ? [{ value: 'recommended', label: `Para você (${candidateArea})` }] : []),
    { value: 'all', label: 'Todas as áreas' },
    { value: 'Tecnologia', label: 'Tecnologia & Software' },
    { value: 'Saúde e Medicina', label: 'Saúde & Medicina' },
    { value: 'Finanças e Contabilidade', label: 'Finanças & Contabilidade' },
    { value: 'Design e Produto', label: 'Design & Produto' },
    { value: 'Recursos Humanos', label: 'Recursos Humanos' },
    { value: 'Comercial e Vendas', label: 'Comercial & Vendas' },
    { value: 'Marketing e Comunicação', label: 'Marketing' },
    { value: 'Operações e Serviços', label: 'Operações & Logística' },
    { value: 'Jurídico e Compliance', label: 'Jurídico & Compliance' },
  ]

  const currentAreaLabel =
    selectedArea === 'recommended' && candidateArea
      ? `Área: ${candidateArea}`
      : selectedArea === 'all'
        ? 'Área de atuação'
        : (areaOptions.find((o) => o.value === selectedArea)?.label ?? `Área: ${selectedArea}`)

  return (
    <div className="min-h-svh bg-canvas">
      <CandidateTopbar />

      {/* HERO SECTION */}
      <section className="relative border-b border-border/70 bg-gradient-to-b from-primary/10 via-card/50 to-canvas pt-12 pb-14 sm:pt-16 sm:pb-18 lg:pt-20 lg:pb-20">
        <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
          {/* Main Hero Headline */}
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Encontre a vaga ideal <span className="block mt-1 sm:mt-2 text-foreground">para o seu perfil</span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            Centenas de oportunidades verificadas nas melhores empresas do Brasil.
            <br className="hidden sm:inline" /> O próximo passo da sua carreira começa agora.
          </p>

          {/* Profile Onboarding Notification Banner */}
          {user && profileComplete === false && (
            <div className="mx-auto mt-6 max-w-2xl">
              <Card className="rounded-2xl border border-primary/40 bg-card p-3.5 sm:p-4 text-left shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground font-black shadow-xs">
                    <Sparkles className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-foreground">
                      Complete seu perfil profissional com IA
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Nossa IA filtrará automaticamente as vagas perfeitas para a sua área.
                    </p>
                  </div>
                </div>
                <Button asChild size="sm" className="w-full sm:w-auto shrink-0 rounded-xl bg-primary text-primary-foreground font-bold shadow-xs hover:bg-primary/90 text-xs">
                  <Link to="/onboarding/perfil" className="flex items-center gap-1.5">
                    Completar perfil <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </Card>
            </div>
          )}

          {/* FLOATING UNIFIED DUAL-INPUT SEARCH BAR */}
          <div className="mx-auto mt-8 max-w-4xl">
            <div className="rounded-2xl sm:rounded-full border border-border/80 bg-card p-2 sm:p-2.5 shadow-lg shadow-foreground/[0.03] transition-all focus-within:border-foreground/30 focus-within:shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0">
              {/* Keyword Input */}
              <div className="relative flex flex-1 items-center px-3 sm:px-4">
                <Search className="size-5 shrink-0 text-muted-foreground/70 mr-3" />
                <input
                  type="text"
                  className="h-11 sm:h-12 w-full bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground/70 outline-none"
                  placeholder="Buscar por palavras-chave no título e descrição"
                  value={keyword}
                  onChange={(e) => handleKeywordChange(e.target.value)}
                  aria-label="Buscar por palavras-chave"
                />
                {keyword && (
                  <button
                    type="button"
                    onClick={() => handleKeywordChange('')}
                    className="p-1 text-muted-foreground hover:text-foreground"
                    aria-label="Limpar termo de busca"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              {/* Desktop Vertical Divider */}
              <div className="hidden sm:block h-8 w-[1px] bg-border mx-1 shrink-0" />

              {/* Location Input */}
              <div className="relative flex flex-1 items-center px-3 sm:px-4 border-t sm:border-t-0 border-border/60 pt-2 sm:pt-0">
                <MapPin className="size-5 shrink-0 text-muted-foreground/70 mr-3" />
                <input
                  type="text"
                  className="h-11 sm:h-12 w-full bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground/70 outline-none"
                  placeholder="Localização (cidade, estado ou país)"
                  value={locationInput}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  aria-label="Buscar por localização"
                />
                {locationInput && (
                  <button
                    type="button"
                    onClick={() => handleLocationChange('')}
                    className="p-1 text-muted-foreground hover:text-foreground"
                    aria-label="Limpar localização"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              {/* Submit / Action Button */}
              <Button
                type="button"
                className="h-11 sm:h-12 rounded-xl sm:rounded-full bg-primary px-6 text-sm font-extrabold text-primary-foreground shadow-xs hover:bg-primary/90 shrink-0"
                onClick={() => void fetchJobs(request)}
              >
                Buscar vagas
              </Button>
            </div>
          </div>

          {/* FILTER DROPDOWN PILLS */}
          <div ref={dropdownRef} className="relative mx-auto mt-5 flex flex-wrap items-center justify-center gap-2.5">
            {/* 1. Tipo de vaga */}
            <div className="relative">
              <button
                type="button"
                className={cn(
                  'h-9 rounded-full px-4 text-xs font-bold transition-all shadow-2xs border inline-flex items-center gap-1.5',
                  workplaceType !== 'all'
                    ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                    : 'border-border bg-card text-foreground hover:border-foreground/30 hover:bg-accent/40',
                )}
                aria-expanded={openDropdown === 'workplace'}
                onClick={() => setOpenDropdown(openDropdown === 'workplace' ? null : 'workplace')}
              >
                <Briefcase className="size-3.5" />
                {workplaceLabels[workplaceType]}
                <ChevronDown className={cn('size-3.5 transition-transform duration-200', openDropdown === 'workplace' && 'rotate-180')} />
              </button>

              {openDropdown === 'workplace' && (
                <div className="absolute left-0 top-full z-50 mt-2 min-w-[12rem] rounded-2xl border border-border bg-popover p-1.5 shadow-xl text-left animate-in fade-in zoom-in-95 duration-150">
                  {(['all', 'Remote', 'Hybrid', 'On-site'] as WorkplaceFilter[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleWorkplaceChange(type)}
                      className={cn(
                        'w-full rounded-xl px-3.5 py-2 text-xs font-semibold text-left transition-colors flex items-center justify-between',
                        workplaceType === type
                          ? 'bg-primary text-primary-foreground font-bold'
                          : 'text-foreground hover:bg-accent',
                      )}
                    >
                      {type === 'all' ? 'Todos os tipos' : workplaceLabels[type]}
                      {workplaceType === type && <div className="size-1.5 rounded-full bg-primary-foreground" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Área de atuação */}
            <div className="relative">
              <button
                type="button"
                className={cn(
                  'h-9 rounded-full px-4 text-xs font-bold transition-all shadow-2xs border inline-flex items-center gap-1.5',
                  selectedArea !== 'all'
                    ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                    : 'border-border bg-card text-foreground hover:border-foreground/30 hover:bg-accent/40',
                )}
                aria-expanded={openDropdown === 'area'}
                onClick={() => setOpenDropdown(openDropdown === 'area' ? null : 'area')}
              >
                {selectedArea === 'recommended' && candidateArea ? (
                  <UserCheck className="size-3.5" />
                ) : (
                  <Layers className="size-3.5" />
                )}
                {currentAreaLabel}
                <ChevronDown className={cn('size-3.5 transition-transform duration-200', openDropdown === 'area' && 'rotate-180')} />
              </button>

              {openDropdown === 'area' && (
                <div className="absolute left-0 sm:left-1/2 sm:-translate-x-1/2 top-full z-50 mt-2 min-w-[16rem] max-h-72 overflow-y-auto rounded-2xl border border-border bg-popover p-1.5 shadow-xl text-left animate-in fade-in zoom-in-95 duration-150">
                  {areaOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleAreaChange(opt.value)}
                      className={cn(
                        'w-full rounded-xl px-3.5 py-2 text-xs font-semibold text-left transition-colors flex items-center justify-between',
                        selectedArea === opt.value
                          ? 'bg-primary text-primary-foreground font-bold'
                          : 'text-foreground hover:bg-accent',
                      )}
                    >
                      <span>{opt.label}</span>
                      {selectedArea === opt.value && <div className="size-1.5 rounded-full bg-primary-foreground shrink-0 ml-2" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Data de publicação */}
            <div className="relative">
              <button
                type="button"
                className={cn(
                  'h-9 rounded-full px-4 text-xs font-bold transition-all shadow-2xs border inline-flex items-center gap-1.5',
                  publishedDate !== 'all'
                    ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                    : 'border-border bg-card text-foreground hover:border-foreground/30 hover:bg-accent/40',
                )}
                aria-expanded={openDropdown === 'date'}
                onClick={() => setOpenDropdown(openDropdown === 'date' ? null : 'date')}
              >
                <Clock className="size-3.5" />
                {dateLabels[publishedDate]}
                <ChevronDown className={cn('size-3.5 transition-transform duration-200', openDropdown === 'date' && 'rotate-180')} />
              </button>

              {openDropdown === 'date' && (
                <div className="absolute right-0 sm:left-0 top-full z-50 mt-2 min-w-[13rem] rounded-2xl border border-border bg-popover p-1.5 shadow-xl text-left animate-in fade-in zoom-in-95 duration-150">
                  {(['all', 'recent', 'month'] as DateFilter[]).map((date) => (
                    <button
                      key={date}
                      type="button"
                      onClick={() => handleDateChange(date)}
                      className={cn(
                        'w-full rounded-xl px-3.5 py-2 text-xs font-semibold text-left transition-colors flex items-center justify-between',
                        publishedDate === date
                          ? 'bg-primary text-primary-foreground font-bold'
                          : 'text-foreground hover:bg-accent',
                      )}
                    >
                      {date === 'all' ? 'Qualquer momento' : dateLabels[date]}
                      {publishedDate === date && <div className="size-1.5 rounded-full bg-primary-foreground" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-9 rounded-full px-3.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-dashed border-border/80 bg-card hover:bg-accent inline-flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <RotateCcw className="size-3" />
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        {/* Section Header: Title + Counter */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              {keyword
                ? `Vagas para "${keyword}"`
                : selectedArea === 'recommended' && candidateArea
                  ? `Vagas para você em ${candidateArea}`
                  : selectedArea !== 'all'
                    ? `Vagas em ${selectedArea}`
                    : 'Todas as vagas disponíveis'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {keyword
                ? 'Resultados em todas as empresas e áreas de atuação.'
                : selectedArea === 'recommended' && candidateArea
                  ? 'Selecionadas e ordenadas para o seu perfil profissional.'
                  : 'Oportunidades em tempo real sincronizadas da plataforma InHire.'}
            </p>
          </div>
          <span className="text-xs font-bold text-muted-foreground bg-card border border-border/80 rounded-full px-3 py-1.5 shadow-2xs w-fit">
            {loading ? 'Carregando…' : total ? `${total} oportunidades` : '0 oportunidades'}
          </span>
        </div>

        {/* Jobs Grid (2 Columns on Desktop) */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-2xl border border-border bg-card/60 p-5 shadow-xs"
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
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              {candidateArea && selectedArea === 'recommended'
                ? `Não encontramos vagas abertas no momento para a área "${candidateArea}". Tente buscar em todas as áreas ou ajustar os filtros.`
                : 'Tente alterar os termos da busca, limpar filtros ou pesquisar por outra localização.'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-5 rounded-full">
                <RotateCcw className="mr-1.5 size-3.5" /> Limpar filtros e ver todas
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
