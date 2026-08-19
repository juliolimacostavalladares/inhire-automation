import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from './use-auth'
import { registerSchema, type RegisterInput } from './auth.schema'
import type { LoginAnimationState } from './login-animation.types'

interface RegisterFormProps {
  onAnimationChange: (state: LoginAnimationState) => void
}

export function RegisterForm({ onAnimationChange }: RegisterFormProps) {
  const { register: createAccount } = useAuth()
  const [serverError, setServerError] = useState<string>()
  const [phase, setPhase] = useState<LoginAnimationState['phase']>('idle')
  const { control, register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  })
  const name = useWatch({ control, name: 'name' }) ?? ''
  const email = useWatch({ control, name: 'email' }) ?? ''
  const password = useWatch({ control, name: 'password' }) ?? ''

  useEffect(() => {
    if (phase === 'submitting' || phase === 'success' || phase === 'error') {
      onAnimationChange({ phase, progress: phase === 'error' ? 0.82 : 1 })
      return
    }
    if (password.length > 0) {
      onAnimationChange({ phase: 'password', progress: 0.5 + Math.min(password.length / 8, 1) * 0.34 })
      return
    }
    if (email.length > 0) {
      onAnimationChange({ phase: 'email', progress: 0.28 + Math.min(email.length / 18, 1) * 0.18 })
      return
    }
    if (name.length > 0) {
      onAnimationChange({ phase: 'email', progress: 0.12 + Math.min(name.length / 18, 1) * 0.14 })
      return
    }
    onAnimationChange({ phase: 'idle', progress: 0 })
  }, [email, name, onAnimationChange, password, phase])

  const onSubmit = handleSubmit(async (values) => {
    setServerError(undefined)
    setPhase('submitting')
    try {
      await createAccount(values)
      setPhase('success')
    } catch (error) {
      setPhase('error')
      setServerError(error instanceof Error ? error.message : 'Não foi possível criar sua conta.')
    }
  })

  return (
    <form className="grid gap-4" onSubmit={onSubmit} noValidate>
      <div className="grid gap-2">
        <Label htmlFor="register-name">Nome</Label>
        <Input id="register-name" autoComplete="name" placeholder="Seu nome completo" startIcon={<UserRound />} invalid={Boolean(errors.name)} {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="register-email">E-mail</Label>
        <Input id="register-email" type="email" autoComplete="email" placeholder="voce@email.com" startIcon={<Mail />} invalid={Boolean(errors.email)} {...register('email')} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="register-password">Senha</Label>
        <Input id="register-password" type="password" autoComplete="new-password" placeholder="Mínimo de 8 caracteres" startIcon={<LockKeyhole />} invalid={Boolean(errors.password)} {...register('password')} />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>
      {serverError && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">{serverError}</p>}
      <Button size="lg" className="mt-2 w-full justify-between" disabled={isSubmitting}>
        <span className="flex-1">{isSubmitting ? 'Criando conta…' : 'Criar minha conta'}</span>
        <ArrowRight />
      </Button>
    </form>
  )
}
