import { useEffect } from 'react'
import { ArrowLeft, Bookmark, ExternalLink, MapPin, Share2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Logo } from '@/components/brand/logo'
import { CompanyLogo } from '@/components/brand/company-logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useJobs } from '@/features/jobs/use-jobs'
import { TailoredResumeCard } from '@/features/jobs/tailored-resume-card'
import { cn } from '@/lib/utils'

export function JobDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { selectedJob: job, selectedLoading, detailError, favorites, selectJob, clearSelection, toggleFavorite } = useJobs()

  useEffect(() => {
    if (!id) return
    clearSelection()
    void selectJob(id)
  }, [clearSelection, id, selectJob])

  if (selectedLoading || job?.id !== id) {
    return <main className="grid min-h-svh place-items-center bg-canvas text-sm text-muted-foreground">Carregando detalhes da vaga…</main>
  }

  if (!job) {
    return (
      <main className="grid min-h-svh place-items-center bg-canvas p-6 text-center">
        <div>
          <p className="text-eyebrow">OPORTUNIDADE NÃO ENCONTRADA</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em]">Essa vaga não está mais disponível.</h1>
          <Button className="mt-6" onClick={() => navigate('/vagas')}>
            <ArrowLeft /> Voltar para a busca
          </Button>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-svh bg-canvas">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-17 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-3">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/vagas"><ArrowLeft /> Voltar para vagas</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-5 py-7 sm:px-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-8 lg:px-10 lg:py-10">
        <article>
          <Button asChild variant="link" className="mb-5 -ml-3 px-3 text-muted-foreground sm:hidden">
            <Link to="/vagas"><ArrowLeft /> Voltar para vagas</Link>
          </Button>

          <Card className="overflow-hidden">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="flex items-start gap-4 sm:gap-5">
                <CompanyLogo
                  logoUrl={job.logoUrl}
                  company={job.company}
                  initials={job.initials}
                  className="size-14 rounded-lg text-sm sm:size-16"
                />
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-muted-foreground">{job.company}</p>
                  <h1 className="mt-2 text-3xl font-extrabold leading-[1.05] tracking-[-0.045em] sm:text-4xl lg:text-5xl">
                    {job.title}
                  </h1>
                  <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-4" /> {job.location} · {job.publishedLabel}
                  </p>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap gap-2">
                <Badge variant="default">{job.workplace}</Badge>
                <Badge variant="secondary">{job.seniority}</Badge>
                <Badge variant="secondary">{job.contract}</Badge>
                <Badge variant="secondary">{job.area}</Badge>
              </div>
            </div>

            <Separator />

            <div className="p-6 sm:p-8 lg:p-10">
              {detailError && <p role="alert" className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{detailError}</p>}

              <section>
                <h2 className="mb-6 text-xl font-extrabold text-foreground">Descrição da vaga</h2>
                {job.descriptionHtml ? (
                  <div
                    className="prose max-w-none text-sm leading-relaxed text-muted-foreground [&_h1]:text-xl [&_h1]:font-extrabold [&_h1]:text-foreground [&_h1]:mt-6 [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-extrabold [&_h2]:text-foreground [&_h2]:mt-5 [&_h2]:mb-2.5 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-foreground [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_ol]:space-y-1.5 [&_li]:text-muted-foreground [&_strong]:text-foreground [&_strong]:font-bold [&_b]:text-foreground [&_b]:font-bold [&_a]:text-primary [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: job.descriptionHtml }}
                  />
                ) : (
                  <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
                    {job.description}
                  </p>
                )}
              </section>
            </div>
          </Card>
        </article>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:h-fit">
          <TailoredResumeCard jobId={job.id} jobTitle={job.title} />

          <Card className="p-5 sm:p-6">
            <p className="text-eyebrow">PRÓXIMO PASSO</p>
            <h2 className="mt-3 text-xl font-extrabold tracking-[-0.025em]">Gostou dessa oportunidade?</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Você será direcionado para a página oficial da InHire para concluir a candidatura.
            </p>
            <Button size="lg" className="mt-6 w-full" asChild>
              <a href={job.url} target="_blank" rel="noreferrer">
                Candidatar-se na InHire <ExternalLink />
              </a>
            </Button>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => toggleFavorite(job.id)} aria-pressed={favorites.has(job.id)}>
                <Bookmark className={cn(favorites.has(job.id) && 'fill-primary text-primary')} />
                {favorites.has(job.id) ? 'Salva' : 'Salvar'}
              </Button>
              <Button variant="outline" onClick={() => void navigator.clipboard?.writeText(job.url)}>
                <Share2 /> Compartilhar
              </Button>
            </div>
            <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
              A candidatura é feita externamente e não é registrada como candidatura no InHire Hub.
            </p>
          </Card>
        </aside>
      </main>
    </div>
  )
}
