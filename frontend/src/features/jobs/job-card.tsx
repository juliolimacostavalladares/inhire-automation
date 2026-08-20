import { Heart } from 'lucide-react'
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

  return (
    <a
      href={`/vagas/${job.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group block text-inherit no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl"
      onClick={handleClick}
    >
      <Card
        className={cn(
          'relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-160 hover:border-primary hover:shadow-xs',
          selected && 'border-primary bg-accent/20',
        )}
      >
        <div>
          {/* Header: Company Avatar + Company Name + Job Title + Heart */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <CompanyLogo
                logoUrl={job.logoUrl}
                company={job.company}
                initials={job.initials}
                className="size-11 shrink-0 rounded-xl border border-border bg-muted/20 text-xs font-extrabold text-foreground"
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-muted-foreground">{job.company}</p>
                <h3 className="mt-0.5 text-base sm:text-lg font-extrabold leading-snug tracking-tight text-foreground group-hover:text-primary transition-colors">
                  {job.title}
                </h3>
              </div>
            </div>

            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="-mr-1.5 -mt-1.5 size-8 shrink-0 rounded-full text-muted-foreground hover:text-primary hover:bg-muted/40 transition-colors relative z-10"
              aria-label={favorite ? `Remover ${job.title} dos favoritos` : `Salvar ${job.title}`}
              aria-pressed={favorite}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onFavorite()
              }}
            >
              <Heart className={cn('size-4 transition-colors', favorite && 'fill-primary text-primary')} />
            </Button>
          </div>

          {/* Location & Metadata Line */}
          <p className="mt-2.5 text-xs text-muted-foreground">
            {job.location} • {job.workplace} • {job.publishedLabel}
          </p>

          {/* Badges Row */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            {/* Area: Primary Lime Badge from InHire Design System */}
            <span className="inline-flex items-center rounded-lg bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground shadow-2xs">
              {job.area}
            </span>
            {/* Other attributes: Neutral Border Badges */}
            <span className="inline-flex items-center rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              {job.workplace}
            </span>
            <span className="inline-flex items-center rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              {job.seniority}
            </span>
            <span className="inline-flex items-center rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              {job.contract}
            </span>
          </div>
        </div>
      </Card>
    </a>
  )
}
