import { API_BASE } from './api'

export interface SavedFilter {
  id: number
  label: string
  payload: Record<string, unknown>
}

export interface SavedFilterList {
  filters: SavedFilter[]
  plan: string
  quota: number | null // null = illimité
}

const authHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`
})

const unwrap = async (response: Response) => {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Erreur')
  return data
}

class FilterService {
  async list(token: string): Promise<SavedFilterList> {
    return unwrap(await fetch(`${API_BASE}/filters`, { headers: authHeaders(token) }))
  }

  async save(token: string, label: string, payload: Record<string, unknown>): Promise<SavedFilter> {
    return unwrap(await fetch(`${API_BASE}/filters`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ label, payload })
    }))
  }

  async remove(token: string, id: number): Promise<void> {
    await unwrap(await fetch(`${API_BASE}/filters/${id}`, { method: 'DELETE', headers: authHeaders(token) }))
  }
}

export default new FilterService()
