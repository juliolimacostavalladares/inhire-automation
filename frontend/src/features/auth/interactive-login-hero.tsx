import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { BadgeCheck } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import type { LoginAnimationState } from './login-animation.types'

gsap.registerPlugin(useGSAP)

const FRAME_COUNT = 180
const LAST_FRAME = FRAME_COUNT - 1

const loginPhaseLabels: Record<LoginAnimationState['phase'], string> = {
  idle: 'Comece pelo seu e-mail',
  email: 'Identificando seu perfil',
  password: 'Preparando sua entrada',
  submitting: 'Abrindo novas possibilidades',
  success: 'Tudo pronto. Bem-vindo!',
  error: 'Revise seus dados e tente novamente',
}

const registerPhaseLabels: Record<LoginAnimationState['phase'], string> = {
  idle: 'Comece pelo seu nome',
  email: 'Construindo seu perfil',
  password: 'Protegendo sua conta',
  submitting: 'Criando seu acesso',
  success: 'Tudo pronto. Bem-vindo!',
  error: 'Revise seus dados e tente novamente',
}

function getFrameUrl(frame: number) {
  const fileNumber = String(frame + 1).padStart(3, '0')
  return `/mascote-frames/ezgif-frame-${fileNumber}.jpg`
}

interface InteractiveLoginHeroProps {
  animation: LoginAnimationState
  mode?: 'login' | 'register'
}

export function InteractiveLoginHero({ animation, mode = 'login' }: InteractiveLoginHeroProps) {
  const rootRef = useRef<HTMLElement>(null)
  const mediaRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const backgroundImageRef = useRef<HTMLImageElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const progressRef = useRef<HTMLSpanElement>(null)
  const progressValueRef = useRef<HTMLSpanElement>(null)
  const preloadedFramesRef = useRef<HTMLImageElement[]>([])
  const playheadRef = useRef({ frame: 0 })
  const currentFrameRef = useRef(0)
  const progressTweenRef = useRef<gsap.core.Tween | null>(null)
  const phaseLabels = mode === 'register' ? registerPhaseLabels : loginPhaseLabels

  const renderFrame = useCallback((rawFrame: number) => {
    const frame = gsap.utils.clamp(0, LAST_FRAME, Math.round(rawFrame))
    if (frame === currentFrameRef.current && imageRef.current?.src) return

    const normalizedProgress = frame / LAST_FRAME
    currentFrameRef.current = frame
    playheadRef.current.frame = frame

    const frameUrl = getFrameUrl(frame)
    if (backgroundImageRef.current) backgroundImageRef.current.src = frameUrl
    if (imageRef.current) imageRef.current.src = frameUrl
    if (progressRef.current) gsap.set(progressRef.current, { scaleX: normalizedProgress })
    if (progressValueRef.current) progressValueRef.current.textContent = `${Math.round(normalizedProgress * 100)}%`
  }, [])

  useEffect(() => {
    let nextFrame = 0
    let preloadTimer = 0
    let hasStarted = false
    const desktopViewport = window.matchMedia('(min-width: 1024px)')

    const preloadBatch = () => {
      const batchEnd = Math.min(nextFrame + 24, FRAME_COUNT)

      while (nextFrame < batchEnd) {
        const image = new Image()
        image.decoding = 'async'
        image.src = getFrameUrl(nextFrame)
        preloadedFramesRef.current[nextFrame] = image
        nextFrame += 1
      }

      if (nextFrame < FRAME_COUNT) preloadTimer = window.setTimeout(preloadBatch, 40)
    }

    const startPreload = () => {
      if (hasStarted || !desktopViewport.matches) return
      hasStarted = true
      preloadBatch()
    }

    startPreload()
    desktopViewport.addEventListener('change', startPreload)

    return () => {
      window.clearTimeout(preloadTimer)
      desktopViewport.removeEventListener('change', startPreload)
      preloadedFramesRef.current = []
    }
  }, [])

  useGSAP(
    () => {
      const root = rootRef.current
      const media = mediaRef.current
      const glow = glowRef.current
      if (!root || !media || !glow) return

      const motionPreference = gsap.matchMedia()

      motionPreference.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.timeline({ defaults: { ease: 'power3.out' } })
          .from(media, { scale: 1.02, duration: 1.6, ease: 'power2.out' })
          .from('[data-hero-reveal]', { autoAlpha: 0, y: 24, duration: 0.8, stagger: 0.09 }, 0.2)
          .from('[data-hero-chip]', { autoAlpha: 0, scale: 0.88, duration: 0.55, stagger: 0.08, ease: 'back.out(1.6)' }, 0.65)

        const moveMediaX = gsap.quickTo(media, 'x', { duration: 0.8, ease: 'power3.out' })
        const moveMediaY = gsap.quickTo(media, 'y', { duration: 0.8, ease: 'power3.out' })
        const rotateMedia = gsap.quickTo(media, 'rotation', { duration: 1, ease: 'power3.out' })
        const moveGlowX = gsap.quickTo(glow, 'x', { duration: 0.45, ease: 'power2.out' })
        const moveGlowY = gsap.quickTo(glow, 'y', { duration: 0.45, ease: 'power2.out' })

        const resetParallax = () => {
          moveMediaX(0)
          moveMediaY(0)
          rotateMedia(0)
          moveGlowX(0)
          moveGlowY(0)
        }

        const handlePointerMove = (event: PointerEvent) => {
          const bounds = root.getBoundingClientRect()
          const normalizedX = (event.clientX - bounds.left) / bounds.width - 0.5
          const normalizedY = (event.clientY - bounds.top) / bounds.height - 0.5

          moveMediaX(normalizedX * -12)
          moveMediaY(normalizedY * -10)
          rotateMedia(normalizedX * 0.35)
          moveGlowX(normalizedX * 72)
          moveGlowY(normalizedY * 72)
        }

        root.addEventListener('pointermove', handlePointerMove)
        root.addEventListener('pointerleave', resetParallax)

        return () => {
          root.removeEventListener('pointermove', handlePointerMove)
          root.removeEventListener('pointerleave', resetParallax)
        }
      })

      motionPreference.add('(min-width: 1024px) and (prefers-reduced-motion: reduce)', () => {
        gsap.set('[data-hero-reveal], [data-hero-chip]', { autoAlpha: 1, clearProps: 'transform' })
      })

      return () => motionPreference.revert()
    },
    { scope: rootRef },
  )

  useEffect(() => {
    const targetFrame = gsap.utils.clamp(0, LAST_FRAME, animation.progress * LAST_FRAME)
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    progressTweenRef.current?.kill()

    if (reducedMotion) {
      renderFrame(targetFrame)
      return
    }

    progressTweenRef.current = gsap.to(playheadRef.current, {
      frame: targetFrame,
      duration: animation.phase === 'submitting' ? 1.6 : 0.7,
      ease: animation.phase === 'success' ? 'back.out(1.15)' : 'power3.out',
      snap: { frame: 1 },
      overwrite: true,
      onUpdate: () => renderFrame(playheadRef.current.frame),
    })

    return () => {
      progressTweenRef.current?.kill()
      progressTweenRef.current = null
    }
  }, [animation.phase, animation.progress, renderFrame])

  return (
    <aside ref={rootRef} className="group relative hidden h-full min-h-0 overflow-hidden bg-obsidian text-white lg:block">
      <div ref={mediaRef} className="absolute inset-0 will-change-transform">
        <img
          ref={backgroundImageRef}
          className="absolute inset-0 size-full scale-105 select-none object-cover object-[8%_center] opacity-60 blur-xl brightness-75 saturate-110"
          src={getFrameUrl(0)}
          alt=""
          draggable={false}
          aria-hidden="true"
        />
        <img
          ref={imageRef}
          className="media-blend-mask absolute bottom-0 left-1/2 h-auto w-[125%] max-w-none -translate-x-1/2 select-none object-contain brightness-110 saturate-110"
          src={getFrameUrl(0)}
          alt=""
          draggable={false}
          aria-hidden="true"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />
      <div
        ref={glowRef}
        className="pointer-events-none absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl will-change-transform"
      />

      <div className="relative z-10 flex h-full flex-col p-9">
        <header data-hero-reveal className="flex items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-3" aria-label="Acesso rápido">
            <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/10"><Link to="/vagas">Explorar vagas</Link></Button>
            <Button asChild variant="outline" size="pill" className="border-white/40 bg-black/30 text-white backdrop-blur-md hover:bg-black/50">
              <Link to={mode === 'register' ? '/login' : '/cadastro'}>{mode === 'register' ? 'Já tenho conta' : 'Criar conta'}</Link>
            </Button>
          </nav>
        </header>

        <div className="mt-[clamp(2.5rem,7vh,6rem)] max-w-[520px]">
          <p data-hero-reveal className="text-display text-balance">{mode === 'register' ? 'Abra espaço para oportunidades que combinam com você.' : 'Encontre a saída para uma carreira que combina com você.'}</p>
          <p data-hero-reveal className="mt-4 max-w-md text-base text-zinc-200">{mode === 'register' ? 'Crie seu perfil e acompanhe o personagem abrir o caminho para novas possibilidades.' : 'Preencha seu acesso e acompanhe o personagem abrir o caminho para novas oportunidades.'}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <span data-hero-chip className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/40 px-4 py-3 text-sm font-bold backdrop-blur-md">
              <BadgeCheck className="size-4 text-primary" />438 oportunidades
            </span>
          </div>
        </div>

        <footer data-hero-reveal className="relative -mx-9 -mb-9 mt-auto px-9 pb-9 pt-24">
          <div className="video-footer-blend pointer-events-none absolute inset-0" />

          <div className="relative">
            <div
              className="mb-5 h-1 overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-label="Progresso do acesso"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(animation.progress * 100)}
            >
              <span ref={progressRef} className="block h-full origin-left scale-x-0 rounded-full bg-primary shadow-[0_0_18px_color-mix(in_oklab,var(--primary)_55%,transparent)]" />
            </div>

            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="text-sm font-bold">{phaseLabels[animation.phase]}</p>
              <p className="mt-2 text-xs text-zinc-300">A cena avança junto com o preenchimento do {mode === 'register' ? 'cadastro' : 'login'}.</p>
              </div>
              <span ref={progressValueRef} className="font-mono text-xs tracking-widest text-primary">0%</span>
            </div>
          </div>
        </footer>
      </div>
    </aside>
  )
}
