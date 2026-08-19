import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from './use-auth'
import type { LoginAnimationPhase, LoginAnimationState } from './login-animation.types'
import { loginSchema, type LoginInput } from './auth.schema'

interface LoginFormProps {
  onAnimationChange: (state: LoginAnimationState) => void
}

type ActiveField = 'email' | 'password' | null
type SubmissionPhase = Extract<LoginAnimationPhase, 'submitting' | 'success' | 'error'> | 'editing'

export function LoginForm({ onAnimationChange }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string>()
  const [activeField, setActiveField] = useState<ActiveField>(null)
  const [submissionPhase, setSubmissionPhase] = useState<SubmissionPhase>('editing')
  const authenticate = useAuth().login
  const { control, register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })
  const email = useWatch({ control, name: 'email' }) ?? ''
  const password = useWatch({ control, name: 'password' }) ?? ''
  const emailRegistration = register('email')
  const passwordRegistration = register('password')

  useEffect(() => {
    if (submissionPhase === 'submitting') {
      onAnimationChange({ phase: 'submitting', progress: 1 })
      return
    }

    if (submissionPhase === 'success') {
      onAnimationChange({ phase: 'success', progress: 1 })
      return
    }

    if (submissionPhase === 'error') {
      onAnimationChange({ phase: 'error', progress: 0.82 })
      return
    }

    if (password.length > 0) {
      onAnimationChange({
        phase: 'password',
        progress: 0.48 + Math.min(password.length / 8, 1) * 0.34,
      })
      return
    }

    if (activeField === 'password') {
      onAnimationChange({ phase: 'password', progress: 0.48 })
      return
    }

    if (email.length > 0) {
      onAnimationChange({
        phase: 'email',
        progress: 0.12 + Math.min(email.length / 18, 1) * 0.3,
      })
      return
    }

    if (activeField === 'email') {
      onAnimationChange({ phase: 'email', progress: 0.12 })
      return
    }

    onAnimationChange({ phase: 'idle', progress: 0 })
  }, [activeField, email, onAnimationChange, password, submissionPhase])

  const resumeEditing = () => {
    setSubmissionPhase('editing')
    setServerError(undefined)
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerError(undefined)
    setSubmissionPhase('submitting')
    try {
      await authenticate(values)
      setSubmissionPhase('success')
    } catch (error) {
      setSubmissionPhase('error')
      setServerError(error instanceof Error ? error.message : 'Não foi possível entrar.')
    }
  }, () => {
    setSubmissionPhase('editing')
  })

  return (
    <form className="grid gap-4" onSubmit={onSubmit} noValidate>
      <div className="grid gap-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="voce@email.com"
          startIcon={<Mail />}
          invalid={Boolean(errors.email)}
          {...emailRegistration}
          onFocus={() => setActiveField('email')}
          onBlur={(event) => {
            void emailRegistration.onBlur(event)
            setActiveField((field) => field === 'email' ? null : field)
          }}
          onChange={(event) => {
            resumeEditing()
            void emailRegistration.onChange(event)
          }}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Senha</Label>
          <Button type="button" variant="link" className="h-auto p-0 text-xs font-semibold">Esqueci minha senha</Button>
        </div>
        <Input
          id="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Sua senha"
          startIcon={<LockKeyhole />}
          endIcon={(
            <button type="button" className="rounded-sm p-1 hover:text-foreground" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword((value) => !value)}>
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          )}
          invalid={Boolean(errors.password)}
          {...passwordRegistration}
          onFocus={() => setActiveField('password')}
          onBlur={(event) => {
            void passwordRegistration.onBlur(event)
            setActiveField((field) => field === 'password' ? null : field)
          }}
          onChange={(event) => {
            resumeEditing()
            void passwordRegistration.onChange(event)
          }}
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      {serverError && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">{serverError}</p>}

      <Button size="lg" className="mt-2 w-full justify-between" disabled={isSubmitting}>
        <span className="flex-1">{isSubmitting ? 'Entrando...' : 'Entrar'}</span>
        <ArrowRight />
      </Button>

      <div className="flex items-center gap-4 py-1 text-xs text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">ou</div>

      <Button asChild type="button" variant="outline" size="lg" className="w-full">
        <Link to="/cadastro">
        <UserPlus /> Criar uma nova conta
        </Link>
      </Button>
    </form>
  )
}
