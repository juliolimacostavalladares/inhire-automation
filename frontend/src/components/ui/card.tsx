import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <article className={cn('rounded-xl border border-border bg-card text-card-foreground', className)} {...props} />
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <header className={cn('flex flex-col gap-2 p-5', className)} {...props} />
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn('p-5 pt-0', className)} {...props} />
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <footer className={cn('flex items-center p-5 pt-0', className)} {...props} />
}
