import { Bookmark, Heart, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CandidateTopbar } from '@/components/layout/candidate-topbar'
import { MyAreaSidebar } from '@/components/layout/my-area-sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/features/auth/use-auth'
import { useProfileStore } from '@/features/profile/profile.store'
import { useJobs } from '@/features/jobs/use-jobs'

export function FavoritesPage() {
  const { user } = useAuth()
  const { profile } = useProfileStore()
  const { jobs, favorites } = useJobs()

  const favoriteJobs = jobs.filter((job) => favorites.has(job.id))

  const userInitials = (user?.name || 'Talento')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')

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
              <div className="grid size-14 place-items-center rounded-full bg-primary text-sm font-extrabold text-primary-foreground">
                {userInitials || <UserRound />}
              </div>
              <div>
                <p className="text-lg font-extrabold">{user?.name || 'Talento Cadastrado'}</p>
                <p className="text-sm text-muted-foreground">
                  {[
                    profile?.professionalTitle || 'Profissional',
                    profile?.location || 'Brasil',
                    profile?.seniority || 'Sênior',
                  ].join(' · ')}
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link to="/onboarding/perfil">Editar perfil</Link>
            </Button>
          </Card>
          <h2 className="mt-10 text-2xl font-extrabold tracking-[-0.03em]">Vagas salvas</h2>
          <div className="mt-5 space-y-4">
            {favoriteJobs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
                <Heart className="mx-auto size-8 text-muted-foreground/60 mb-3" />
                <p className="font-semibold text-foreground">Você ainda não favoritou nenhuma vaga.</p>
                <p className="mt-1">Explore o portal e clique no coração das vagas que desejar acompanhar.</p>
                <Button className="mt-4" asChild>
                  <Link to="/vagas">Ver vagas disponíveis</Link>
                </Button>
              </div>
            ) : (
              favoriteJobs.map((job) => (
                <Card key={job.id} className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="grid size-12 shrink-0 place-items-center rounded-lg border border-border bg-background text-sm font-extrabold uppercase">
                      {job.initials || job.company.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-muted-foreground">{job.company}</p>
                      <h2 className="mt-1 truncate text-lg font-extrabold">{job.title}</h2>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {job.location && <Badge variant="secondary">{job.location}</Badge>}
                        {job.workplace && <Badge variant="secondary">{job.workplace}</Badge>}
                        {job.contract && <Badge variant="secondary">{job.contract}</Badge>}
                      </div>
                    </div>
                  </div>
                  <Button asChild className="sm:shrink-0">
                    <Link to={`/vagas/${job.id}`}>Ver vaga <Bookmark className="size-4" /></Link>
                  </Button>
                </Card>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
