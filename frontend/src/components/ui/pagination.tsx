import * as React from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, type ButtonProps } from '@/components/ui/button'

export function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  )
}

export const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<'ul'>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn('flex flex-row items-center gap-1.5', className)}
    {...props}
  />
))
PaginationContent.displayName = 'PaginationContent'

export const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<'li'>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn('', className)} {...props} />
))
PaginationItem.displayName = 'PaginationItem'

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ButtonProps, 'size'> &
  React.ComponentProps<'button'>

export function PaginationLink({
  className,
  isActive,
  size = 'icon',
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      aria-current={isActive ? 'page' : undefined}
      variant={isActive ? 'default' : 'outline'}
      size={size}
      className={cn(
        'size-10 rounded-xl font-bold transition-all shadow-2xs text-xs',
        isActive
          ? 'bg-primary text-primary-foreground font-black border-primary hover:bg-primary/90'
          : 'border-border bg-card text-foreground hover:border-foreground/30 hover:bg-accent/40',
        className,
      )}
      {...props}
    />
  )
}

export function PaginationPrevious({
  className,
  disabled,
  ...props
}: React.ComponentProps<typeof PaginationLink> & { disabled?: boolean }) {
  return (
    <Button
      aria-label="Ir para a página anterior"
      variant="outline"
      size="default"
      disabled={disabled}
      className={cn(
        'h-10 rounded-xl px-3.5 text-xs font-bold gap-1 border-border bg-card text-foreground shadow-2xs hover:border-foreground/30 hover:bg-accent/40 disabled:opacity-40 disabled:pointer-events-none',
        className,
      )}
      {...props}
    >
      <ChevronLeft className="size-4" />
      <span className="hidden sm:inline">Anterior</span>
    </Button>
  )
}

export function PaginationNext({
  className,
  disabled,
  ...props
}: React.ComponentProps<typeof PaginationLink> & { disabled?: boolean }) {
  return (
    <Button
      aria-label="Ir para a próxima página"
      variant="outline"
      size="default"
      disabled={disabled}
      className={cn(
        'h-10 rounded-xl px-3.5 text-xs font-bold gap-1 border-border bg-card text-foreground shadow-2xs hover:border-foreground/30 hover:bg-accent/40 disabled:opacity-40 disabled:pointer-events-none',
        className,
      )}
      {...props}
    >
      <span className="hidden sm:inline">Próxima</span>
      <ChevronRight className="size-4" />
    </Button>
  )
}

export function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden
      className={cn('flex size-10 items-center justify-center text-muted-foreground', className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">Mais páginas</span>
    </span>
  )
}
