import { Bookmark, ExternalLink, MapPin, Share2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CompanyLogo } from '@/components/brand/company-logo'
import { cn } from '@/lib/utils'
import type { Job } from './jobs.data'
import { TailoredResumeCard } from './tailored-resume-card'

interface JobDetailPanelProps {
  job: Job
  detailError?: string | null
  favorite: boolean
  onFavorite: () => void
  onClose: () => void
}

export function JobDetailPanel({ job, detailError, favorite, onFavorite, onClose }: JobDetailPanelProps) {
  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-30 bg-obsidian/55 backdrop-blur-[2px] xl:hidden"
        aria-label="Fechar detalhes da vaga"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-label={`Detalhes da vaga ${job.title}`}
        className="fixed inset-y-0 right-0 z-40 flex h-svh w-full max-w-[29rem] min-h-0 animate-in flex-col border-l border-border bg-background duration-300 slide-in-from-right xl:static xl:z-auto xl:h-[calc(100svh-4.25rem)] xl:max-w-none xl:animate-none"
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose()
        }}
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-7 py-8 2xl:px-10">
          <div className="flex items-center justify-between gap-4">
            <p className="text-eyebrow">VAGA SELECIONADA</p>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="rounded-full"
              aria-label="Fechar detalhes da vaga"
              autoFocus
              onClick={onClose}
            >
              <X />
            </Button>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <CompanyLogo
              logoUrl={job.logoUrl}
              company={job.company}
              initials={job.initials}
              className="size-14 rounded-lg text-sm"
            />
            <div>
              <p className="font-extrabold">{job.company}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3.5" /> {job.location}
              </p>
            </div>
          </div>

          <h2 className="mt-7 text-3xl font-extrabold leading-[1.08] tracking-[-0.04em]">{job.title}</h2>

          <div className="mt-5 flex flex-wrap gap-2">
            <Badge variant="default">{job.workplace}</Badge>
            <Badge variant="secondary">{job.seniority}</Badge>
            <Badge variant="secondary">{job.contract}</Badge>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">{job.location} · {job.publishedLabel}</p>
          <Separator className="my-7" />

          {detailError && (
            <div role="alert" className="mb-6 rounded-lg border border-primary/40 bg-primary/10 p-4 text-sm">
              <p className="font-bold">Entre para ver todos os detalhes desta vaga.</p>
              <p className="mt-1 text-muted-foreground">{detailError}</p>
              <Button asChild variant="link" className="mt-1 h-auto px-0">
                <Link to="/login">Entrar agora</Link>
              </Button>
            </div>
          )}

          <div className="mt-6">
            <TailoredResumeCard jobId={job.id} jobTitle={job.title} />
          </div>

          <section className="mt-7">
            <h3 className="text-sm font-extrabold">Sobre a vaga</h3>
            <article className="mt-3 text-sm leading-6 text-muted-foreground" dangerouslySetInnerHTML={{ __html: job.descriptionHtml ?? job.description }}></article>
          </section>

          <section className="mt-7">
            <h3 className="text-sm font-extrabold">Principais requisitos</h3>
            <ul className="mt-3 space-y-3 text-sm leading-5 text-muted-foreground">
              {job.requirements.map((requirement) => (
                <li key={requirement} className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  {requirement}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="border-t border-border bg-background p-7 2xl:px-10">
          <p className="mb-4 text-xs leading-5 text-muted-foreground">
            A candidatura será concluída de forma segura no site da InHire.
          </p>
          <Button size="lg" className="w-full" asChild>
            <a href={job.url} target="_blank" rel="noreferrer">
              Candidatar-se na InHire <ExternalLink />
            </a>
          </Button>
          <Button asChild variant="link" className="mt-2 h-auto w-full text-xs text-muted-foreground">
            <Link to={`/vagas/${job.id}`}>Ver detalhes completos</Link>
          </Button>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={onFavorite} aria-pressed={favorite}>
              <Bookmark className={cn(favorite && 'fill-primary text-primary')} />
              {favorite ? 'Salva' : 'Salvar vaga'}
            </Button>
            <Button
              variant="outline"
              onClick={() => void navigator.clipboard?.writeText(job.url)}
            >
              <Share2 /> Compartilhar
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
