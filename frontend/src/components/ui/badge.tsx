import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex h-7 items-center rounded-full border px-3 text-xs font-bold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-primary/30 bg-primary/15 text-foreground',
        secondary: 'border-border bg-muted text-muted-foreground',
        outline: 'border-border bg-transparent text-foreground',
      },
    },
    defaultVariants: { variant: 'secondary' },
  },
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
