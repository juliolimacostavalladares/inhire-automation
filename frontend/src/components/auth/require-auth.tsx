import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/use-auth'
import type { AuthUser } from '@/features/auth/auth.api'
import { useProfileStore } from '@/features/profile/profile.store'

interface RequireAuthProps {
  children?: React.ReactNode
  role?: AuthUser['role']
  requireProfile?: boolean
}

export function RequireAuth({ children, role, requireProfile = false }: RequireAuthProps) {
  const location = useLocation()
  const { user, hydrate } = useAuth()
  const { profile, hydrate: hydrateProfile } = useProfileStore()
  const [checking, setChecking] = useState(!user)
  const [checkingProfile, setCheckingProfile] = useState(requireProfile && Boolean(user))

  useEffect(() => {
    if (user) return
    let active = true
    void hydrate().finally(() => {
      if (active) setChecking(false)
    })
    return () => { active = false }
  }, [hydrate, user])

  useEffect(() => {
    if (!requireProfile || !user || role === 'ADMIN') {
      setCheckingProfile(false)
      return
    }
    let active = true
    void hydrateProfile().finally(() => { if (active) setCheckingProfile(false) })
    return () => { active = false }
  }, [hydrateProfile, requireProfile, role, user])

  if (checking || checkingProfile) {
    return <main className="grid min-h-svh place-items-center bg-canvas text-sm text-muted-foreground">Verificando sua sessão…</main>
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (role && user.role !== role) {
    return <Navigate to={role === 'ADMIN' ? '/backoffice/login' : '/vagas'} replace />
  }
  if (requireProfile && user.role === 'CANDIDATE' && (!profile || profile.status !== 'COMPLETE')) {
    return <Navigate to="/onboarding/perfil" replace state={{ from: location.pathname }} />
  }
  return children ?? <Outlet />
}
