import axios, { type AxiosInstance } from 'axios'
import { useAuthStore } from '../stores/authStore'

// Fabrique un client Axios qui injecte le JWT et gère le 401 global.
function createClient(baseURL: string): AxiosInstance {
  const client = axios.create({ baseURL })

  client.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  client.interceptors.response.use(
    (res) => res,
    (error) => {
      if (error.response?.status === 401) {
        useAuthStore.getState().logout()
      }
      return Promise.reject(error)
    },
  )

  return client
}

const AUTH_URL = import.meta.env.VITE_AUTH_URL ?? 'http://localhost:3001'
const TONTINE_URL = import.meta.env.VITE_TONTINE_URL ?? 'http://localhost:3002'
const NOTIFY_URL = import.meta.env.VITE_NOTIFY_URL ?? 'http://localhost:3003'

export const authApi = createClient(AUTH_URL)
export const tontineApi = createClient(TONTINE_URL)
export const notifyApi = createClient(NOTIFY_URL)

// Extrait un message d'erreur lisible depuis une réponse Axios.
export function apiError(err: unknown, fallback = 'Une erreur est survenue'): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error?.toString?.() ?? err.message ?? fallback
  }
  return fallback
}
