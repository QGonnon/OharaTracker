import type { AppNotification } from '../types/index'

const getApiBase = (): string =>
  import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3000`

class NotificationService {
  async getNotifications(token: string, opts: { unreadOnly?: boolean; limit?: number } = {}): Promise<AppNotification[]> {
    const params = new URLSearchParams()
    if (opts.unreadOnly) params.set('unreadOnly', 'true')
    if (opts.limit) params.set('limit', String(opts.limit))
    const query = params.toString()

    const response = await fetch(`${getApiBase()}/notifications${query ? `?${query}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!response.ok) throw new Error(`Erreur notifications: ${response.status}`)
    return response.json()
  }

  async getUnreadCount(token: string): Promise<number> {
    const response = await fetch(`${getApiBase()}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!response.ok) throw new Error(`Erreur unread-count: ${response.status}`)
    const data = await response.json()
    return data.count ?? 0
  }

  async markAsRead(token: string, id: number): Promise<void> {
    const response = await fetch(`${getApiBase()}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!response.ok) throw new Error(`Erreur markAsRead: ${response.status}`)
  }

  async markAllAsRead(token: string): Promise<void> {
    const response = await fetch(`${getApiBase()}/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!response.ok) throw new Error(`Erreur markAllAsRead: ${response.status}`)
  }

  async deleteNotification(token: string, id: number): Promise<void> {
    const response = await fetch(`${getApiBase()}/notifications/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!response.ok) throw new Error(`Erreur deleteNotification: ${response.status}`)
  }

  async subscribePush(token: string, subscription: PushSubscription): Promise<void> {
    const response = await fetch(`${getApiBase()}/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(subscription.toJSON())
    })
    if (!response.ok) throw new Error(`Erreur subscribePush: ${response.status}`)
  }

  async unsubscribePush(token: string, endpoint: string): Promise<void> {
    const response = await fetch(`${getApiBase()}/notifications/subscribe`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ endpoint })
    })
    if (!response.ok) throw new Error(`Erreur unsubscribePush: ${response.status}`)
  }
}

export default new NotificationService()
