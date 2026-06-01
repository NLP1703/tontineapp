import { notifyApi } from './api'

export interface Notification {
  id: string
  title: string
  body: string
  type: string
  read_at: string | null
  created_at: string
}

export async function listNotifications() {
  const { data } = await notifyApi.get('/api/notify')
  return data.notifications as Notification[]
}

export async function markNotificationRead(id: string) {
  const { data } = await notifyApi.post(`/api/notify/${id}/read`)
  return data as { ok: boolean }
}
