import { CircleHelp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { InteractiveLoginHero } from '@/features/auth/interactive-login-hero'
import { initialLoginAnimationState, type LoginAnimationState } from '@/features/auth/login-animation.types'
import { LoginForm } from '@/features/auth/login-form'
import { useAuth } from '@/features/auth/use-auth'

export function LoginPage() {
  const [loginAnimation, setLoginAnimation] = useState<LoginAnimationState>(initialLoginAnimationState)
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!user) return
    const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/vagas'
    navigate(destination, { replace: true })
  }, [location.state, navigate, user])

  return (
    <main className="min-h-svh bg-canvas p-3 sm:p-4 lg:grid lg:h-svh lg:min-h-0 lg:place-items-center lg:overflow-hidden lg:p-4 xl:p-6">
      <section className="mx-auto grid min-h-[calc(100svh-1.5rem)] w-full max-w-screen-xl overflow-hidden rounded-shell border border-border bg-card shadow-shell lg:h-full lg:max-h-[960px] lg:min-h-0 lg:grid-cols-[1fr_1.025fr]">
        <InteractiveLoginHero animation={loginAnimation} />

        <div className="flex min-h-full flex-col bg-background px-6 py-6 sm:px-12 lg:h-full lg:min-h-0 lg:overflow-hidden lg:px-[clamp(2rem,4vw,4rem)] lg:py-[clamp(1rem,2.5vh,1.5rem)]">
          <header className="flex items-center justify-between">
            <Logo className="text-foreground" />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="pill"><CircleHelp /> Ajuda</Button>
            </div>
          </header>

          <div className="mx-auto my-auto w-full max-w-[422px] py-8 lg:py-[clamp(0.75rem,2vh,2rem)]">
            <p className="text-eyebrow">BEM-VINDO</p>
            <h1 className="mt-4 text-title">Olá, talento.</h1>
            <p className="mt-3 text-sm text-muted-foreground">Entre para continuar sua busca.</p>
            <div className="mt-8 lg:mt-[clamp(1.25rem,3vh,2.5rem)]"><LoginForm onAnimationChange={setLoginAnimation} /></div>
            <p className="mx-auto mt-8 max-w-sm text-center text-xs leading-relaxed text-muted-foreground lg:mt-[clamp(1.25rem,3vh,2.5rem)]">Ao continuar, você concorda com os Termos de uso e a Política de privacidade.</p>
          </div>
        </div>
      </section>
    </main>
  )
}
