import { API_BASE } from './api'

export interface ClientPreferences {
  emailDigestEnabled: boolean
  emailDigestDay: number
  locale: string | null
  plan?: string
  limits?: Record<string, number | boolean>
}

class PreferencesService {
  async get(token: string): Promise<ClientPreferences> {
    const response = await fetch(`${API_BASE}/client/preferences`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!response.ok) throw new Error(`Erreur préférences: ${response.status}`)
    return response.json()
  }

  // Mise à jour partielle : n'envoyer que les champs modifiés.
  async update(token: string, payload: Partial<ClientPreferences>): Promise<ClientPreferences> {
    const response = await fetch(`${API_BASE}/client/preferences`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.message || 'Erreur lors de la sauvegarde')
    return data
  }
}

export default new PreferencesService()

export interface ProfileAppearance {
  avatarUrl: string | null
  bannerUrl: string | null
  theme: string
  plan?: string
  unlocked?: boolean
  themes?: string[]
}

class AppearanceService {
  async get(token: string): Promise<ProfileAppearance> {
    const response = await fetch(`${API_BASE}/client/appearance`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!response.ok) throw new Error(`Erreur apparence: ${response.status}`)
    return response.json()
  }

  async update(token: string, payload: Partial<ProfileAppearance>): Promise<ProfileAppearance> {
    const response = await fetch(`${API_BASE}/client/appearance`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.message || 'Erreur lors de la sauvegarde')
    return data
  }
}

export const appearanceService = new AppearanceService()
