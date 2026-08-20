import { create } from 'zustand'
import { getApiErrorMessage } from '@/lib/api/http'
import { getCurrentUser, login, logout, register, type AuthUser } from './auth.api'
import type { LoginInput } from './auth.schema'

interface AuthState {
  user: AuthUser | null
  loading: boolean
  error: string | null
  login: (input: LoginInput) => Promise<AuthUser>
  register: (input: { name: string; email: string; password: string }) => Promise<AuthUser>
  hydrate: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
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
    try {
      set({ user: await getCurrentUser() })
    } catch {
      set({ user: null })
    }
  },
  logout: async () => {
    await logout()
    set({ user: null, error: null })
  },
}))
