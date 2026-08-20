import { ArrowRight, BriefcaseBusiness, Check, CircleUserRound, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CandidateTopbar } from '@/components/layout/candidate-topbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/features/auth/use-auth'
import { useProfileStore } from '@/features/profile/profile.store'

export function CareerPage() {
  const { user } = useAuth()
  const { profile } = useProfileStore()

  const profileCompletePercent = profile?.status === 'COMPLETE' ? 100 : profile?.status === 'NEEDS_REVIEW' ? 75 : 30

  return (
    <div className="min-h-svh bg-canvas">
      <CandidateTopbar />
      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        <p className="text-eyebrow">SUA JORNADA</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.045em] sm:text-5xl">Carreira</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Organize seus passos e encontre oportunidades alinhadas ao seu momento profissional.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-[1.35fr_1fr]">
          <Card className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-muted-foreground">Seu perfil profissional</p>
                <h2 className="mt-2 text-2xl font-extrabold">{profile?.professionalTitle || 'Profissional'}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{user?.name} · {profile?.location || 'Brasil'}</p>
              </div>
              <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                <CircleUserRound />
              </div>
            </div>
            <div className="mt-7">
              <div className="flex items-center justify-between text-xs font-bold">
                <span>Perfil completo</span>
                <span className="text-primary">{profileCompletePercent}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${profileCompletePercent}%` }}
                />
              </div>
            </div>
            <Button variant="outline" className="mt-7" asChild>
              <Link to="/onboarding/perfil">
                Revisar meu perfil <ArrowRight className="size-4" />
              </Link>
            </Button>
          </Card>
          <Card className="p-6 sm:p-8">
            <p className="text-sm font-bold text-muted-foreground">Seu momento</p>
            <h2 className="mt-2 text-2xl font-extrabold">Pronto para o próximo passo?</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Explore vagas alinhadas com as competências e tecnologias do seu currículo.
            </p>
            <Button asChild className="mt-6">
              <Link to="/vagas">Explorar oportunidades <BriefcaseBusiness className="size-4" /></Link>
            </Button>
          </Card>
        </div>

        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-eyebrow">PRÓXIMOS PASSOS</p>
              <h2 className="mt-2 text-2xl font-extrabold">Prepare sua próxima oportunidade</h2>
            </div>
            <Badge variant="default"><Sparkles className="size-3.5" /> Recomendado</Badge>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { title: 'Defina suas preferências', desc: 'Mantenha suas modalidades e pretensão salarial atualizadas.' },
              { title: 'Revise suas experiências', desc: 'Garanta que suas conquistas e tecnologias estejam em destaque.' },
              { title: 'Acompanhe vagas salvas', desc: 'Monitore as empresas que você favoritou no portal.' },
            ].map((step) => (
              <Card key={step.title} className="p-5">
                <div className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-4" />
                </div>
                <h3 className="mt-4 font-extrabold">{step.title}</h3>
                <p className="mt-2 text-sm leading-5 text-muted-foreground">{step.desc}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
