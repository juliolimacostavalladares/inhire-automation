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
  token?: string
  accessToken?: string
}

export async function login(input: LoginInput) {
  try {
    const { data } = await http.post<AuthResponse>('/auth/login', input)
    const token = data.token || data.accessToken
    if (token) {
      localStorage.setItem('inhire_token', token)
    }
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
  const token = data.token || data.accessToken
  if (token) {
    localStorage.setItem('inhire_token', token)
  }
  return data.user
}

export async function getCurrentUser() {
  try {
    const { data } = await http.get<AuthUser>('/auth/me')
    return data
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      (error.response?.status === 401 || error.response?.status === 404)
    ) {
      localStorage.removeItem('inhire_token')
    }
    throw error
  }
}

export async function logout() {
  localStorage.removeItem('inhire_token')
  await http.post('/auth/logout')
}
