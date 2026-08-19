import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  compact?: boolean
}

export function Logo({ className, compact = false }: LogoProps) {
  return (
    <div className={cn('inline-flex items-center gap-3', className)} aria-label="InHire Hub">
      <span className="grid size-9 place-items-center rounded-sm bg-primary text-sm font-extrabold text-primary-foreground">IH</span>
      {!compact && <span className="text-lg font-extrabold tracking-tight">InHire Hub</span>}
    </div>
  )
}
