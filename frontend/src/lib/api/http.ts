import axios from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  timeout: 30_000,
  withCredentials: true,
  headers: { Accept: 'application/json' },
})

http.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('inhire_token') : null
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function getApiErrorMessage(error: unknown, fallback = 'Não foi possível carregar os dados.') {
  if (axios.isAxiosError(error)) {
    console.error('[HTTP Error]', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      code: error.code,
    })

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return 'O servidor demorou muito para responder. Tente novamente.'
    }
    if (!error.response) {
      return `Falha de rede ao conectar com a API (${error.message || 'Network Error'}). Verifique se o backend está acessível em http://localhost:3000.`
    }
    if (error.response.status === 401) return 'Sessão expirada. Faça login novamente para continuar.'
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
