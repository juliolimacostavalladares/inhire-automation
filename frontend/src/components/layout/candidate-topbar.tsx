import { BriefcaseBusiness, Building2, LogIn, LogOut, UserRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/use-auth'

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export function CandidateTopbar() {
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex h-17 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Logo />
        <nav className="hidden items-center gap-2 md:flex" aria-label="Navegação do candidato">
          <Button asChild variant="ghost"><NavLink to="/vagas"><BriefcaseBusiness /> Portal de vagas</NavLink></Button>
          <Button asChild variant="ghost"><NavLink to="/empresas"><Building2 /> Empresas</NavLink></Button>
          {user && (
            <Button asChild variant="ghost"><NavLink to="/minha-area"><UserRound /> Minhas Vagas</NavLink></Button>
          )}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Sair"
                onClick={() => { void logout() }}
                className="hidden sm:inline-flex"
              >
                <LogOut />
              </Button>
              <div
                title={user.name}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-extrabold text-primary-foreground"
              >
                {initials(user.name)}
              </div>
            </>
          ) : (
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <NavLink to="/login"><LogIn /> Entrar</NavLink>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
