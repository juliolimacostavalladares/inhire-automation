import axios from 'axios'
import type { LoginInput } from './auth.schema'
import { http } from '@/lib/api/http'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'CANDIDATE' | 'ADMIN'
}

interface AuthResponse {
  user: AuthUser
}

export async function login(input: LoginInput) {
  try {
    const { data } = await http.post<AuthResponse>('/auth/login', input)
    return data.user
  } catch (error) {
    if (axios.isAxiosError(error) && !error.response) {
      throw new Error('Não foi possível conectar ao servidor.')
    }
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw new Error('E-mail ou senha incorretos.')
    }
    throw new Error('Não foi possível entrar. Tente novamente.')
  }
}

export async function register(input: { name: string; email: string; password: string }) {
  const { data } = await http.post<AuthResponse>('/auth/register', input)
  return data.user
}

export async function getCurrentUser() {
  const { data } = await http.get<AuthUser>('/auth/me')
  return data
}

export async function logout() {
  await http.post('/auth/logout')
}
