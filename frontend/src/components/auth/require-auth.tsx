import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/use-auth'
import type { AuthUser } from '@/features/auth/auth.api'

interface RequireAuthProps {
  children: React.ReactNode
  role?: AuthUser['role']
}

export function RequireAuth({ children, role }: RequireAuthProps) {
  const location = useLocation()
  const { user, hydrate } = useAuth()
  const [checking, setChecking] = useState(!user)

  useEffect(() => {
    if (user) return
    let active = true
    void hydrate().finally(() => {
      if (active) setChecking(false)
    })
    return () => { active = false }
  }, [hydrate, user])

  if (checking) {
    return <main className="grid min-h-svh place-items-center bg-canvas text-sm text-muted-foreground">Verificando sua sessão…</main>
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (role && user.role !== role) {
    return <Navigate to={role === 'ADMIN' ? '/backoffice/login' : '/vagas'} replace />
  }
  return children
}
