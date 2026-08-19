import { ArrowLeft, FileCheck2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CandidateTopbar } from '@/components/layout/candidate-topbar'
import { MyAreaSidebar } from '@/components/layout/my-area-sidebar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function ApplicationsPage() {
  return (
    <div className="min-h-svh bg-canvas">
      <CandidateTopbar />
      <main className="mx-auto grid max-w-7xl gap-7 px-5 py-8 sm:px-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:px-10 lg:py-12">
        <MyAreaSidebar />
        <section>
          <p className="text-eyebrow">MINHA ÁREA</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.045em]">Minhas Candidaturas</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Acompanhe aqui quando houver candidaturas iniciadas dentro do InHire Hub.</p>
          <Card className="mt-8 flex flex-col items-center px-6 py-14 text-center sm:px-12">
            <div className="grid size-14 place-items-center rounded-full bg-primary/20 text-primary"><FileCheck2 /></div>
            <h2 className="mt-5 text-xl font-extrabold">Nenhuma candidatura registrada</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Como as candidaturas são concluídas no site externo da InHire, o status só aparecerá aqui quando essa integração estiver disponível.</p>
            <Button asChild className="mt-6"><Link to="/vagas"><ArrowLeft /> Voltar para vagas</Link></Button>
          </Card>
        </section>
      </main>
    </div>
  )
}
