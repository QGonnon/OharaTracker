import { API_BASE } from './api'

export interface Partner {
  name: string
  kind: 'platform' | 'creator'
  url: string | null
  logoUrl: string | null
  description: string | null
  locales: string[] | null
  isHighlighted: boolean
}

class PartnerService {
  // Endpoint public : les pages partenaires sont consultables sans compte.
  async list(options: { kind?: string; locale?: string } = {}): Promise<Partner[]> {
    const query = new URLSearchParams()
    if (options.kind) query.set('kind', options.kind)
    if (options.locale) query.set('locale', options.locale)
    const suffix = query.toString() ? `?${query}` : ''

    const response = await fetch(`${API_BASE}/partners${suffix}`)
    if (!response.ok) throw new Error(`Erreur partenaires: ${response.status}`)
    return response.json()
  }
}

export default new PartnerService()
