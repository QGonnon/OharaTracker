import { API_BASE } from './api'

export interface Suggestion {
  id: number
  title: string
  slug: string
  kind: 'lecture' | 'serie' | 'film'
  type: string | null
  description: string | null
  coverPath: string | null
  coverUrl: string | null
  followers: number
  affinity: number
  genres: string[]
}

export interface SuggestionResult {
  items: Suggestion[]
  mode: 'simple' | 'weighted'
  fallback: boolean // true = repli sur le catalogue populaire
  plan: string
  locked?: boolean // true = offre insuffisante (402)
}

class SuggestionService {
  async get(token: string, limit = 12): Promise<SuggestionResult> {
    const response = await fetch(`${API_BASE}/suggestions?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await response.json().catch(() => ({}))

    // 402 = fonctionnalité premium : ce n'est pas une erreur, c'est une invitation.
    if (response.status === 402) {
      return { items: [], mode: 'simple', fallback: false, plan: data.plan ?? 'Free', locked: true }
    }
    if (!response.ok) throw new Error(data.message || 'Erreur lors du chargement des suggestions')
    return data
  }
}

export default new SuggestionService()
