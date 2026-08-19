import { BriefcaseBusiness, LogIn, Sparkles, UserRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Logo } from '@/components/brand/logo'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Button } from '@/components/ui/button'

export function CandidateTopbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex h-17 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Logo />
        <nav className="hidden items-center gap-2 md:flex" aria-label="Navegação do candidato">
          <Button asChild variant="ghost"><NavLink to="/vagas"><BriefcaseBusiness /> Portal de vagas</NavLink></Button>
          <Button asChild variant="ghost"><NavLink to="/minha-area"><UserRound /> Minhas Vagas</NavLink></Button>
          <Button asChild variant="ghost"><NavLink to="/carreira"><Sparkles /> Carreira</NavLink></Button>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button asChild variant="outline" className="hidden sm:inline-flex"><NavLink to="/login"><LogIn /> Entrar</NavLink></Button>
          <ThemeToggle />
          <div className="grid size-9 place-items-center rounded-full bg-secondary text-xs font-extrabold text-secondary-foreground">MA</div>
        </div>
      </div>
    </header>
  )
}
