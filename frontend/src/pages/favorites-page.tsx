import { Bookmark, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CandidateTopbar } from '@/components/layout/candidate-topbar'
import { MyAreaSidebar } from '@/components/layout/my-area-sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { jobs } from '@/features/jobs/jobs.data'

const favoriteIds = ['brq-fullstack', 'nubank-product-designer', 'finance-analyst']

export function FavoritesPage() {
  const favoriteJobs = jobs.filter((job) => favoriteIds.includes(job.id))

  return (
    <div className="min-h-svh bg-canvas">
      <CandidateTopbar />
      <main className="mx-auto grid max-w-7xl gap-7 px-5 py-8 sm:px-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:px-10 lg:py-12">
        <MyAreaSidebar />
        <section>
          <p className="text-eyebrow">MINHA ÁREA</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.045em]">Minha área</h1>
          <p className="mt-2 text-sm text-muted-foreground">Gerencie seu perfil e as oportunidades da sua jornada.</p>
          <Card className="mt-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-center gap-4">
              <div className="grid size-14 place-items-center rounded-full bg-secondary text-sm font-extrabold text-secondary-foreground">MA</div>
              <div><p className="text-lg font-extrabold">Marina Alves</p><p className="text-sm text-muted-foreground">Analista de Produto · Remoto · Pleno</p></div>
            </div>
            <Button variant="outline">Editar perfil</Button>
          </Card>
          <h2 className="mt-10 text-2xl font-extrabold tracking-[-0.03em]">Vagas salvas</h2>
          <div className="mt-5 space-y-4">
            {favoriteJobs.map((job) => (
              <Card key={job.id} className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="grid size-12 shrink-0 place-items-center rounded-lg border border-border bg-background text-sm font-extrabold">{job.initials}</div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-muted-foreground">{job.company}</p>
                    <h2 className="mt-1 truncate text-lg font-extrabold">{job.title}</h2>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="secondary">{job.location}</Badge><Badge variant="secondary">{job.workplace}</Badge><Badge variant="secondary">{job.contract}</Badge>
                    </div>
                  </div>
                </div>
                <Button asChild className="sm:shrink-0"><Link to={`/vagas/${job.id}`}>Ver vaga <Bookmark /></Link></Button>
              </Card>
            ))}
          </div>
          <div className="mt-8 flex items-center gap-3 rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
            <Heart className="size-5 text-primary" /> Salve vagas para acompanhar oportunidades que combinam com você.
          </div>
        </section>
      </main>
    </div>
  )
}
