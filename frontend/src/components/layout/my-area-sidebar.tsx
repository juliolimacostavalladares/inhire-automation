import { Bookmark, FileCheck2 } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const items = [
  { label: 'Vagas salvas', icon: Bookmark, to: '/minha-area' },
  { label: 'Minhas Candidaturas', icon: FileCheck2, to: '/minha-area/candidaturas' },
]

export function MyAreaSidebar() {
  return (
    <aside className="rounded-xl border border-border bg-card p-3 lg:sticky lg:top-24 lg:h-[calc(100svh-10rem)] lg:p-5">
      <p className="px-1 text-xs font-extrabold uppercase tracking-[0.12em] text-muted-foreground">Minha área</p>
      <nav className="mt-3 flex gap-3 overflow-x-auto lg:mt-4 lg:flex lg:flex-col lg:gap-3" aria-label="Navegação da minha área">
        {items.map(({ label, icon: Icon, to }) => (
          <NavLink key={to} to={to} end={to === '/minha-area'} className="block shrink-0">
            {({ isActive }) => (
              <Button variant={isActive ? 'default' : 'outline'} className={cn('h-10 w-auto shrink-0 justify-start whitespace-nowrap px-3 lg:w-full', !isActive && 'text-muted-foreground')}>
                <Icon /> {label}
              </Button>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
