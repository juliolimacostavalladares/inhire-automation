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
    if (error.response.status === 404) return 'O recurso solicitado não foi encontrado.'
    if (error.response.status >= 500) return 'O servidor está temporariamente indisponível.'

    const data = error.response.data
    if (data && typeof data === 'object') {
      if ('message' in data) {
        if (Array.isArray(data.message)) {
          return data.message.join(', ')
        }
        if (typeof data.message === 'string') {
          return data.message
        }
      }
    }
  }
  return fallback
}
