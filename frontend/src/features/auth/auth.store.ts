import { create } from 'zustand'
import { getApiErrorMessage } from '@/lib/api/http'
import { getCurrentUser, login, logout, register, type AuthUser } from './auth.api'
import type { LoginInput } from './auth.schema'

function getInitialUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  const token = localStorage.getItem('inhire_token')
  if (!token) return null
  const savedUser = localStorage.getItem('inhire_user')
  if (!savedUser) return null
  try {
    return JSON.parse(savedUser) as AuthUser
  } catch {
    return null
  }
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  error: string | null
  login: (input: LoginInput) => Promise<AuthUser>
  register: (input: { name: string; email: string; password: string }) => Promise<AuthUser>
  hydrate: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: getInitialUser(),
  loading: false,
  error: null,
  login: async (input) => {
    set({ loading: true, error: null })
    try {
      const user = await login(input)
      set({ user, loading: false })
      return user
    } catch (error) {
      const message = error instanceof Error ? error.message : getApiErrorMessage(error)
      set({ loading: false, error: message })
      throw error
    }
  },
  register: async (input) => {
    set({ loading: true, error: null })
    try {
      const user = await register(input)
      set({ user, loading: false })
      return user
    } catch (error) {
      const message = error instanceof Error ? error.message : getApiErrorMessage(error)
      set({ loading: false, error: message })
      throw error
    }
  },
  hydrate: async () => {
    if (typeof window === 'undefined') return
    const token = localStorage.getItem('inhire_token')
    if (!token) {
      set({ user: null })
      return
    }

    try {
      const user = await getCurrentUser()
      set({ user })
    } catch {
      // Only clear user if the token was actually rejected (401/404)
      const currentToken = localStorage.getItem('inhire_token')
      if (!currentToken) {
        set({ user: null })
      } else {
        // Retain initial local user if it was just a temporary network error
        const existing = get().user
        if (!existing) {
          set({ user: getInitialUser() })
        }
      }
    }
  },
  logout: async () => {
    await logout()
    set({ user: null, error: null })
  },
}))
