import { Bookmark } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Job } from './jobs.data'

interface JobCardProps {
  job: Job
  selected: boolean
  favorite: boolean
  onSelect: () => void
  onFavorite: () => void
}

export function JobCard({ job, selected, favorite, onSelect, onFavorite }: JobCardProps) {
  return (
    <Card
      className={cn(
        'group relative cursor-pointer overflow-hidden p-4 transition-[border-color,background-color,transform] duration-fast hover:-translate-y-0.5 hover:border-primary/40 sm:p-5',
        selected && 'border-primary/45 bg-accent',
      )}
      onClick={onSelect}
      aria-current={selected ? 'true' : undefined}
    >
      <div className="flex gap-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-md border border-border bg-background text-xs font-extrabold text-foreground">
          {job.initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-muted-foreground">{job.company}</p>
              <h3 className="mt-1 text-base font-extrabold leading-snug tracking-[-0.02em] sm:text-lg">
                {job.title}
              </h3>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="-mr-2 -mt-2 size-9 rounded-full"
              aria-label={favorite ? `Remover ${job.title} dos favoritos` : `Salvar ${job.title}`}
              aria-pressed={favorite}
              onClick={(event) => {
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
            <Badge variant={selected ? 'default' : 'secondary'}>{job.area}</Badge>
            <Badge variant="outline">{job.seniority}</Badge>
            <span className="ml-auto text-xs font-semibold text-muted-foreground">{job.publishedLabel}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
