import { CircleHelp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '@/components/brand/logo'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Button } from '@/components/ui/button'
import { InteractiveLoginHero } from '@/features/auth/interactive-login-hero'
import { initialLoginAnimationState } from '@/features/auth/login-animation.types'
import { RegisterForm } from '@/features/auth/register-form'
import { useAuth } from '@/features/auth/use-auth'
import { getProfile } from '@/features/profile/profile.api'

export function RegisterPage() {
  const [animation, setAnimation] = useState(initialLoginAnimationState)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    void getProfile().then((profile) => navigate(profile?.status === 'COMPLETE' ? '/vagas' : '/onboarding/perfil', { replace: true })).catch(() => navigate('/onboarding/perfil', { replace: true }))
  }, [navigate, user])

  return (
    <main className="min-h-svh bg-canvas p-3 sm:p-4 lg:grid lg:h-svh lg:min-h-0 lg:place-items-center lg:overflow-hidden lg:p-4 xl:p-6">
      <section className="mx-auto grid min-h-[calc(100svh-1.5rem)] w-full max-w-screen-xl overflow-hidden rounded-shell border border-border bg-card shadow-shell lg:h-full lg:max-h-[960px] lg:min-h-0 lg:grid-cols-[1fr_1.025fr]">
        <InteractiveLoginHero animation={animation} mode="register" />
        <div className="flex min-h-full flex-col bg-background px-6 py-6 sm:px-12 lg:h-full lg:min-h-0 lg:overflow-hidden lg:px-[clamp(2rem,4vw,4rem)] lg:py-[clamp(1rem,2.5vh,1.5rem)]">
          <header className="flex items-center justify-between">
            <Logo className="text-foreground" />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="outline" size="pill"><CircleHelp /> Ajuda</Button>
            </div>
          </header>
          <div className="mx-auto my-auto w-full max-w-[422px] py-8 lg:py-[clamp(0.75rem,2vh,2rem)]">
            <p className="text-eyebrow">NOVO TALENTO</p>
            <h1 className="mt-4 text-title">Crie seu acesso.</h1>
            <p className="mt-3 text-sm text-muted-foreground">Monte seu perfil para continuar sua jornada.</p>
            <div className="mt-8 lg:mt-[clamp(1.25rem,3vh,2.5rem)]"><RegisterForm onAnimationChange={setAnimation} /></div>
            <p className="mx-auto mt-8 max-w-sm text-center text-xs leading-relaxed text-muted-foreground lg:mt-[clamp(1.25rem,3vh,2.5rem)]">Ao criar sua conta, você concorda com os Termos de uso e a Política de privacidade.</p>
          </div>
        </div>
      </section>
    </main>
  )
}
