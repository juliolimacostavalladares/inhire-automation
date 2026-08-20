import { useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Play,
  Search,
  Settings,
} from 'lucide-react'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import { Logo } from '@/components/brand/logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { jobs } from '@/features/jobs/jobs.data'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/use-auth'

const adminNavigation = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/backoffice' },
  { label: 'Empresas / tenants', icon: Building2, to: '/backoffice/tenants' },
  { label: 'Vagas coletadas', icon: BriefcaseBusiness, to: '/backoffice/jobs' },
  { label: 'Execuções', icon: Clock3, to: '/backoffice/runs' },
]

function BackofficeSidebar() {
  return (
    <aside className="hidden h-svh flex-col border-r border-border bg-background px-4 py-6 lg:flex">
      <Logo className="px-3" />
      <p className="mt-14 px-3 text-xs font-extrabold uppercase tracking-[0.12em] text-muted-foreground">Operação</p>
      <nav className="mt-4 space-y-2" aria-label="Navegação do backoffice">
        {adminNavigation.map(({ label, icon: Icon, to }) => (
          <NavLink key={to} to={to} end={to === '/backoffice'}>
            {({ isActive }) => (
              <Button variant="ghost" className={cn('w-full justify-start', isActive ? 'bg-accent text-foreground' : 'text-muted-foreground')}>
                <Icon /> {label}
              </Button>
            )}
          </NavLink>
        ))}
      </nav>
      <p className="mt-12 px-3 text-xs font-extrabold uppercase tracking-[0.12em] text-muted-foreground">Sistema</p>
      <div className="mt-4 space-y-2">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground"><Settings /> Configurações</Button>
        <Button asChild variant="ghost" className="w-full justify-start text-muted-foreground"><Link to="/backoffice/login"><LogOut /> Sair</Link></Button>
      </div>
      <div className="mt-auto flex items-center justify-between rounded-lg border border-border bg-card p-3">
        <div><p className="text-sm font-extrabold">Admin InHire</p><p className="text-xs text-muted-foreground">Operações</p></div>
      </div>
    </aside>
  )
}

function BackofficeLayout({ children, title, eyebrow = 'BACKOFFICE', action }: { children: React.ReactNode; title: string; eyebrow?: string; action?: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-canvas lg:grid lg:h-svh lg:grid-cols-[14.5rem_minmax(0,1fr)]">
      <BackofficeSidebar />
      <main className="min-w-0 lg:h-svh lg:overflow-y-auto">
        <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-eyebrow">{eyebrow}</p><h1 className="mt-2 text-4xl font-extrabold tracking-[-0.045em] sm:text-5xl">{title}</h1></div>
            {action}
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}

export function BackofficeLoginPage() {
  const navigate = useNavigate()
  const { login, loading } = useAuth()
  const [error, setError] = useState<string>()
  return (
    <main className="grid min-h-svh place-items-center bg-canvas p-5">
      <Card className="w-full max-w-md p-7 sm:p-10">
        <Logo />
        <p className="mt-12 text-eyebrow">ACESSO RESTRITO</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.045em]">Entrar no backoffice</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Gerencie coletas, empresas e a saúde das fontes do InHire Hub.</p>
        <form className="mt-8 space-y-4" onSubmit={async (event) => {
          event.preventDefault()
          setError(undefined)
          const values = new FormData(event.currentTarget)
          try {
            const user = await login({ email: String(values.get('email')), password: String(values.get('password')) })
            if (user.role !== 'ADMIN') {
              setError('Esta conta não possui acesso administrativo.')
              return
            }
            navigate('/backoffice')
          } catch (loginError) {
            setError(loginError instanceof Error ? loginError.message : 'Não foi possível entrar.')
          }
        }}>
          <Input name="email" type="email" placeholder="admin@inhire.com" aria-label="E-mail administrativo" required />
          <Input name="password" type="password" placeholder="Sua senha" aria-label="Senha administrativa" required />
          {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
          <Button size="lg" className="w-full" disabled={loading}>{loading ? 'Entrando…' : 'Entrar no backoffice'}</Button>
        </form>
        <Button asChild variant="link" className="mt-5 w-full text-muted-foreground"><Link to="/login"><ArrowLeft /> Voltar para área do candidato</Link></Button>
      </Card>
    </main>
  )
}

export function BackofficeDashboardPage() {
  const bars = [48, 66, 55, 84, 72, 100, 78]
  return (
    <BackofficeLayout title="Dashboard" action={<Badge variant="outline" className="h-12 rounded-lg px-5">18 ago 2026</Badge>}>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Vagas publicadas', '438', '12 hoje'],
          ['Empresas ativas', '24', '100% online'],
          ['Última coleta', '6m', '438 processadas'],
          ['Falhas', '0', 'Operação saudável'],
        ].map(([label, value, helper]) => <Card key={label} className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-4 text-4xl font-extrabold tracking-[-0.04em]">{value}</p><p className="mt-2 text-sm font-bold text-emerald-500">{helper}</p></Card>)}
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <Card className="p-6"><h2 className="text-xl font-extrabold">Vagas coletadas nos últimos 7 dias</h2><div className="mt-8 flex h-56 items-end gap-4 sm:gap-8">{bars.map((height, index) => <div key={index} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-md bg-primary" style={{ height: `${height}%` }} /><span className="text-xs text-muted-foreground">{index + 12}</span></div>)}</div></Card>
        <Card className="p-6"><h2 className="text-xl font-extrabold">Saúde das fontes</h2><div className="mt-7 space-y-6"><div><p className="flex items-center gap-2 font-bold text-emerald-500"><CheckCircle2 /> BRQ</p><p className="mt-1 text-sm text-muted-foreground">103 vagas</p></div><div><p className="flex items-center gap-2 font-bold text-emerald-500"><CheckCircle2 /> FCamara</p><p className="mt-1 text-sm text-muted-foreground">87 vagas</p></div><div><p className="flex items-center gap-2 font-bold text-amber-500"><AlertTriangle /> Exemplo RH</p><p className="mt-1 text-sm text-muted-foreground">Resposta lenta</p></div></div></Card>
      </div>
      <AdminRunTable compact />
    </BackofficeLayout>
  )
}

const tenants = [
  ['BRQ Digital Solutions', 'brq', '103 vagas', 'Ativa'],
  ['FCamara', 'fcamara', '87 vagas', 'Ativa'],
  ['Bernhoeft', 'bernhoeft', '51 vagas', 'Ativa'],
  ['Exemplo RH', 'exemplo-rh', '23 vagas', 'Atenção'],
]

function SearchBar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <div className="mt-8"><Input startIcon={<Search />} placeholder="Buscar e filtrar" value={value} onChange={(event) => onChange(event.target.value)} /></div>
}

export function BackofficeTenantsPage() {
  const [query, setQuery] = useState('')
  const filtered = tenants.filter((tenant) => tenant.join(' ').toLocaleLowerCase().includes(query.toLocaleLowerCase()))
  return <BackofficeLayout title="Empresas / tenants" action={<Button><Building2 /> Adicionar empresa</Button>}><SearchBar value={query} onChange={setQuery} /><Card className="mt-6 overflow-hidden"><div className="hidden grid-cols-[2fr_1fr_1fr_1fr] gap-4 border-b border-border px-5 py-4 text-xs font-bold uppercase tracking-wide text-muted-foreground sm:grid"><span>Nome</span><span>Tipo</span><span>Atualização</span><span>Status</span></div>{filtered.map(([name, slug, count, status]) => <div key={slug} className="grid gap-2 border-b border-border p-5 last:border-0 sm:grid-cols-[2fr_1fr_1fr_1fr] sm:items-center sm:gap-4"><span className="font-extrabold">{name}</span><span className="text-sm text-muted-foreground">{slug}</span><span className="text-sm text-muted-foreground">{count}</span><span className={cn('flex items-center gap-2 text-sm font-bold', status === 'Ativa' ? 'text-emerald-500' : 'text-amber-500')}>{status === 'Ativa' ? <CheckCircle2 /> : <AlertTriangle />}{status}</span></div>)}</Card></BackofficeLayout>
}

export function BackofficeJobsPage() {
  const [query, setQuery] = useState('')
  const filtered = jobs.filter((job) => `${job.title} ${job.company}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
  return <BackofficeLayout title="Vagas coletadas" action={<Button><ExternalLink /> Exportar CSV</Button>}><SearchBar value={query} onChange={setQuery} /><Card className="mt-6 overflow-hidden"><div className="hidden grid-cols-[2fr_1fr_1fr_1fr] gap-4 border-b border-border px-5 py-4 text-xs font-bold uppercase tracking-wide text-muted-foreground sm:grid"><span>Nome</span><span>Empresa</span><span>Atualização</span><span>Status</span></div>{filtered.map((job) => <div key={job.id} className="grid gap-2 border-b border-border p-5 last:border-0 sm:grid-cols-[2fr_1fr_1fr_1fr] sm:items-center sm:gap-4"><span className="font-extrabold">{job.title}</span><span className="text-sm text-muted-foreground">{job.company}</span><span className="text-sm text-muted-foreground">{job.publishedLabel}</span><span className="flex items-center gap-2 text-sm font-bold text-emerald-500"><CheckCircle2 /> Publicada</span></div>)}</Card></BackofficeLayout>
}

const runs = [['15b01938', 'Coleta', '438 / 438', 'Concluída'], ['3c09775c', 'Coleta', '438 / 438', 'Concluída'], ['8a0e89a', 'Descoberta', '23 / 24', '1 alerta']]

function AdminRunTable({ compact = false }: { compact?: boolean }) {
  return <section className="mt-8"><div className="mb-4 flex items-center justify-between"><h2 className="text-2xl font-extrabold">Execuções recentes</h2>{compact && <Button asChild variant="link"><Link to="/backoffice/runs">Ver todas <ChevronRight /></Link></Button>}</div><Card className="overflow-hidden">{runs.map(([id, type, progress, status]) => <Link key={id} to={`/backoffice/runs/${id}`} className="grid gap-2 border-b border-border p-5 last:border-0 hover:bg-accent sm:grid-cols-[2fr_1fr_1fr_1fr] sm:items-center"><span className="font-extrabold">#{id}</span><span>{type}</span><span className="text-sm text-muted-foreground">{progress}</span><span className={cn('flex items-center gap-2 text-sm font-bold', status === '1 alerta' ? 'text-amber-500' : 'text-emerald-500')}>{status === '1 alerta' ? <AlertTriangle /> : <CheckCircle2 />}{status}</span></Link>)}</Card></section>
}

export function BackofficeRunsPage() {
  return <BackofficeLayout title="Execuções" action={<Button><Play /> Executar coleta</Button>}><div className="mt-8"><SearchBar value="" onChange={() => undefined} /></div><AdminRunTable /></BackofficeLayout>
}

export function BackofficeRunDetailsPage() {
  const { id = '15b01938' } = useParams<{ id: string }>()
  return <BackofficeLayout title={`Execução #${id}`}><Card className="mt-10 p-6 sm:p-8"><p className="flex items-center gap-2 font-bold text-emerald-500"><CheckCircle2 /> CONCLUÍDA</p><h2 className="mt-5 text-2xl font-extrabold">Coleta agendada · 18 ago 2026, 22:00</h2><p className="mt-3 text-sm text-muted-foreground">438 processadas · 12 criadas · 426 atualizadas · 0 falhas</p></Card><section className="mt-10"><h2 className="text-2xl font-extrabold">Linha do tempo</h2><Card className="mt-5 overflow-hidden">{[['Execução concluída', '22:05:28', '438 itens processados'], ['Detalhes sincronizados', '22:04:51', 'Descrições e formulários'], ['Coleta iniciada', '22:00:00', '24 tenants ativos']].map(([title, time, detail]) => <div key={title} className="grid gap-2 border-b border-border p-5 last:border-0 sm:grid-cols-[2fr_1fr_2fr_1fr] sm:items-center"><span className="font-extrabold">{title}</span><span>{time}</span><span className="text-sm text-muted-foreground">{detail}</span><span className="flex items-center gap-2 text-sm font-bold text-emerald-500"><CheckCircle2 /> OK</span></div>)}</Card></section></BackofficeLayout>
}
