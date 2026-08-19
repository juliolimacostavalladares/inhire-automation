import axios from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  timeout: 15_000,
  withCredentials: true,
  headers: { Accept: 'application/json' },
})

export function getApiErrorMessage(error: unknown, fallback = 'Não foi possível carregar os dados.') {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Não foi possível conectar ao servidor.'
    if (error.response.status === 401) return 'Faça login para continuar.'
    if (error.response.status === 403) {
      const message = error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data
        ? error.response.data.message
        : undefined
      return typeof message === 'string' ? message : 'Faça login para usar esta funcionalidade.'
    }
    if (error.response.status === 404) return 'O recurso solicitado não foi encontrado.'
    if (error.response.status >= 500) return 'O servidor está temporariamente indisponível.'
  }
  return fallback
}
