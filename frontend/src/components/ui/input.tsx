import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  startIcon?: ReactNode
  endIcon?: ReactNode
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, startIcon, endIcon, invalid, ...props }, ref) => (
    <div
      className={cn(
        'group flex h-14 items-center gap-3 rounded-md border border-input bg-background px-4 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/25',
        invalid && 'border-destructive focus-within:border-destructive focus-within:ring-destructive/20',
        className,
      )}
    >
      {startIcon && <span className="text-muted-foreground [&_svg]:size-5">{startIcon}</span>}
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      />
      {endIcon && <span className="text-muted-foreground [&_svg]:size-5">{endIcon}</span>}
    </div>
  ),
)
Input.displayName = 'Input'
