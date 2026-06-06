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

// Same-origin par défaut : base vide => les appels partent en relatif (/api/...)
// et sont routés par l'API Gateway Nginx (prod/cluster) ou par le proxy Vite en
// dev (cf. vite.config.ts). On n'utilise une URL absolue QUE si VITE_*_URL est
// défini ET non vide — plus jamais de fallback `localhost:300x` qui provoque des
// ERR_CONNECTION_REFUSED dès qu'on n'est pas en dev direct.
const AUTH_URL = import.meta.env.VITE_AUTH_URL || ''
const TONTINE_URL = import.meta.env.VITE_TONTINE_URL || ''
const NOTIFY_URL = import.meta.env.VITE_NOTIFY_URL || ''

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
