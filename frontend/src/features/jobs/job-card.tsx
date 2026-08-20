import { Bookmark, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
    // If onSelect is provided, call it
    if (onSelect) {
      onSelect()
    }
  }

  return (
    <a
      href={`/vagas/${job.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block text-inherit no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
      onClick={handleClick}
    >
      <Card
        className={cn(
          'group relative cursor-pointer overflow-hidden p-4 transition-[border-color,background-color,transform] duration-fast hover:-translate-y-0.5 hover:border-primary/40 sm:p-5',
          selected && 'border-primary/45 bg-accent',
        )}
      >
        <div className="flex gap-4">
          <CompanyLogo
            logoUrl={job.logoUrl}
            company={job.company}
            initials={job.initials}
            className="size-11"
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-muted-foreground">{job.company}</p>
                <h3 className="mt-1 text-base font-extrabold leading-snug tracking-[-0.02em] sm:text-lg group-hover:text-primary transition-colors flex items-center gap-1.5">
                  <span>{job.title}</span>
                  <ExternalLink className="size-3.5 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
                </h3>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="-mr-2 -mt-2 size-9 rounded-full relative z-10"
                aria-label={favorite ? `Remover ${job.title} dos favoritos` : `Salvar ${job.title}`}
                aria-pressed={favorite}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onFavorite()
                }}
              >
                <Bookmark className={cn(favorite && 'fill-primary text-primary')} />
              </Button>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              {job.location} · {job.workplace}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{job.area}</Badge>
              <Badge variant="outline">{job.seniority}</Badge>
              <span className="ml-auto text-xs font-semibold text-muted-foreground">{job.publishedLabel}</span>
            </div>
          </div>
        </div>
      </Card>
    </a>
  )
}
