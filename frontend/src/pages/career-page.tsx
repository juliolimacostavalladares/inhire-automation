import { ArrowRight, BriefcaseBusiness, Check, CircleUserRound, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CandidateTopbar } from '@/components/layout/candidate-topbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function CareerPage() {
  return (
    <div className="min-h-svh bg-canvas">
      <CandidateTopbar />
      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        <p className="text-eyebrow">SUA JORNADA</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.045em] sm:text-5xl">Carreira</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Organize seus próximos passos e encontre oportunidades alinhadas ao momento da sua carreira.</p>

        <div className="mt-8 grid gap-5 md:grid-cols-[1.35fr_1fr]">
          <Card className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-muted-foreground">Seu perfil profissional</p><h2 className="mt-2 text-2xl font-extrabold">Analista de Produto</h2></div><div className="grid size-12 place-items-center rounded-full bg-secondary text-secondary-foreground"><CircleUserRound /></div></div>
            <div className="mt-7"><div className="flex items-center justify-between text-xs font-bold"><span>Perfil completo</span><span className="text-primary">72%</span></div><div className="mt-2 h-2 rounded-full bg-muted"><div className="h-full w-[72%] rounded-full bg-primary" /></div></div>
            <Button variant="outline" className="mt-7">Completar meu perfil <ArrowRight /></Button>
          </Card>
          <Card className="p-6 sm:p-8"><p className="text-sm font-bold text-muted-foreground">Seu momento</p><h2 className="mt-2 text-2xl font-extrabold">Pronta para o próximo passo?</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Existem oportunidades que combinam com suas preferências.</p><Button asChild className="mt-6"><Link to="/vagas">Explorar oportunidades <BriefcaseBusiness /></Link></Button></Card>
        </div>

        <section className="mt-10"><div className="flex items-end justify-between gap-4"><div><p className="text-eyebrow">PRÓXIMOS PASSOS</p><h2 className="mt-2 text-2xl font-extrabold">Prepare sua próxima oportunidade</h2></div><Badge variant="default"><Sparkles /> Recomendado</Badge></div><div className="mt-5 grid gap-3 sm:grid-cols-3">{['Defina suas áreas de interesse', 'Atualize suas preferências', 'Explore novas vagas'].map((step) => <Card key={step} className="p-5"><div className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-4" /></div><h3 className="mt-4 font-extrabold">{step}</h3><p className="mt-2 text-sm leading-5 text-muted-foreground">Mantenha seu perfil pronto para as melhores oportunidades.</p></Card>)}</div></section>
      </main>
    </div>
  )
}
