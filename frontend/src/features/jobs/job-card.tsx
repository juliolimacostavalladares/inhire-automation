import { Bookmark, CheckCircle2, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CompanyLogo } from '@/components/brand/company-logo'
import { cn } from '@/lib/utils'
import type { Job } from './jobs.data'

interface JobCardProps {
  job: Job
  selected?: boolean
  favorite: boolean
  onFavorite: () => void
  onSelect?: () => void
}

export function JobCard({ job, selected, favorite, onFavorite, onSelect }: JobCardProps) {
  const handleClick = (_e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onSelect) {
      onSelect()
    }
  }

  const requirementsText =
    job.requirements && job.requirements.length > 0
      ? job.requirements.slice(0, 2).join(' · ')
      : job.description

  return (
    <a
      href={`/vagas/${job.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group block text-inherit no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-3xl"
      onClick={handleClick}
    >
      <Card
        className={cn(
          'relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md',
          selected && 'border-primary bg-accent/30',
        )}
      >
        {/* Header: Logo + Info + Bookmark */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <CompanyLogo
                logoUrl={job.logoUrl}
                company={job.company}
                initials={job.initials}
                className="size-13 shrink-0 rounded-2xl shadow-xs"
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-muted-foreground">{job.company}</p>
                <h3 className="mt-0.5 text-base sm:text-lg font-extrabold leading-snug tracking-tight text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                  <span className="truncate">{job.title}</span>
                  <ExternalLink className="size-3.5 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {job.location} · {job.workplace}
                </p>
              </div>
            </div>

            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="-mr-1.5 -mt-1.5 size-9 shrink-0 rounded-full bg-muted/40 hover:bg-muted transition-colors relative z-10"
              aria-label={favorite ? `Remover ${job.title} dos favoritos` : `Salvar ${job.title}`}
              aria-pressed={favorite}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onFavorite()
              }}
            >
              <Bookmark className={cn('size-4', favorite && 'fill-primary text-primary')} />
            </Button>
          </div>

          {/* Badges Row */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-xl bg-accent px-3 py-1.5 text-xs font-bold text-foreground">
              {job.workplace}
            </span>
            <span className="inline-flex items-center rounded-xl bg-muted/80 px-3 py-1.5 text-xs font-semibold text-foreground">
              {job.seniority}
            </span>
            <span className="inline-flex items-center rounded-xl bg-muted/80 px-3 py-1.5 text-xs font-semibold text-foreground">
              {job.contract}
            </span>
            <span className="inline-flex items-center rounded-xl bg-primary/15 px-3 py-1.5 text-xs font-bold text-foreground">
              {job.area}
            </span>
          </div>

          {/* Snippet */}
          {requirementsText && (
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground line-clamp-2">
              <span className="font-semibold text-foreground/80">Requisitos: </span>
              {requirementsText}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3 text-[0.75rem]">
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
            <CheckCircle2 className="size-3.5" />
            Vaga verificada
          </span>
          <span className="font-medium text-muted-foreground">{job.publishedLabel}</span>
        </div>
      </Card>
    </a>
  )
}
