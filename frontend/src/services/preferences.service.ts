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

export interface DiscoveryPreferences {
  defaultType: 'all' | 'manga' | 'anime'
  pinnedGenres: string[]
  hideTrending: boolean
  hideSpotlight: boolean
}

class DiscoveryPreferencesService {
  async get(token: string): Promise<{ preferences: DiscoveryPreferences | null; unlocked: boolean }> {
    const response = await fetch(`${API_BASE}/client/discovery`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!response.ok) throw new Error('Erreur préférences Découverte')
    return response.json()
  }

  async update(token: string, preferences: Partial<DiscoveryPreferences>): Promise<{ preferences: DiscoveryPreferences }> {
    const response = await fetch(`${API_BASE}/client/discovery`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(preferences)
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.message || 'Erreur lors de la sauvegarde')
    return data
  }
}

export const discoveryPreferencesService = new DiscoveryPreferencesService()

export interface FeatureMatrix {
  plan: string
  limits: Record<string, number | boolean | null>
  earlyAccess: boolean
  beta: { key: string; unlocked: boolean }[]
}

class FeatureService {
  async get(token: string): Promise<FeatureMatrix> {
    const response = await fetch(`${API_BASE}/features`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!response.ok) throw new Error('Erreur lors du chargement des fonctionnalités')
    return response.json()
  }
}

export const featureService = new FeatureService()
