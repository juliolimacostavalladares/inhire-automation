import { useState } from 'react'
import { cn } from '@/lib/utils'

interface CompanyLogoProps {
  logoUrl?: string | null
  company: string
  initials: string
  className?: string
  imageClassName?: string
}

export function CompanyLogo({
  logoUrl,
  company,
  initials,
  className,
  imageClassName,
}: CompanyLogoProps) {
  const [hasError, setHasError] = useState(false)

  const showLogo = Boolean(logoUrl && !hasError)

  return (
    <div
      className={cn(
        'grid size-11 shrink-0 place-items-center overflow-hidden rounded-md border border-border text-xs font-extrabold transition-colors',
        showLogo
          ? 'bg-white p-1.5 dark:bg-white dark:border-border/70'
          : 'bg-background text-foreground',
        className,
      )}
    >
      {showLogo ? (
        <img
          src={logoUrl!}
          alt={company}
          loading="lazy"
          className={cn('size-full object-contain', imageClassName)}
          onError={() => setHasError(true)}
        />
      ) : (
        <span>{initials || company.slice(0, 2).toUpperCase()}</span>
      )}
    </div>
  )
}
