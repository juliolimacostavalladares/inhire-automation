import { BriefcaseBusiness, UserRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'

const navigation = [
  { label: 'Encontrar vagas', icon: BriefcaseBusiness, to: '/vagas' },
  { label: 'Meu perfil', icon: UserRound, to: '/perfil' },
]

export function CandidateSidebar() {
  return (
    <aside className="hidden h-svh min-h-0 flex-col border-r border-border bg-background px-4 py-6 lg:flex">
      <Logo className="px-3" />

      <nav className="mt-12" aria-label="Navegação do candidato">
        <p className="px-3 text-[0.65rem] font-extrabold uppercase tracking-[0.15em] text-muted-foreground">
          Sua jornada
        </p>
        <div className="mt-3 space-y-1">
          {navigation.map(({ label, icon: Icon, to }) => (
            <NavLink key={label} to={to} end={to === '/vagas'} className={({ isActive }) => isActive ? 'block' : 'block'}>
              {({ isActive }) => (
                <Button
                  type="button"
                  variant="ghost"
                  className={isActive ? 'w-full justify-start bg-accent text-foreground' : 'w-full justify-start text-muted-foreground'}
                >
                  <Icon /> {label}
                </Button>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="mt-auto">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-full bg-primary text-xs font-extrabold text-primary-foreground">
              MA
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold">Marina Alves</p>
              <p className="truncate text-xs text-muted-foreground">Analista de Produto</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-[0.65rem] font-bold text-muted-foreground">
            <span className="rounded-full bg-muted px-2.5 py-1">Remoto</span>
            <span className="rounded-full bg-muted px-2.5 py-1">Pleno</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
