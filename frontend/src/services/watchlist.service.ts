import { API_BASE } from './api'

export interface WatchlistWork {
  idLibrary: number
  title: string
  coverPath: string | null
  coverUrl: string | null
  type: string | null
}

export interface Watchlist {
  id: number
  title: string
  description: string | null
  isPublic: boolean
  shareToken: string | null
  owner?: string
  followerCount: number
  works: WatchlistWork[]
}

export interface WatchlistCollection {
  owned: Watchlist[]
  followed: Watchlist[]
  plan: string
  quotas: { owned: number | null; followed: number | null } // null = illimité
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

class WatchlistService {
  async list(token: string): Promise<WatchlistCollection> {
    return unwrap(await fetch(`${API_BASE}/watchlists`, { headers: authHeaders(token) }))
  }

  async create(token: string, title: string, description?: string): Promise<Watchlist> {
    return unwrap(await fetch(`${API_BASE}/watchlists`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ title, description })
    }))
  }

  async remove(token: string, id: number): Promise<void> {
    await unwrap(await fetch(`${API_BASE}/watchlists/${id}`, { method: 'DELETE', headers: authHeaders(token) }))
  }

  async setSharing(token: string, id: number, isPublic: boolean): Promise<{ isPublic: boolean; shareToken: string | null }> {
    return unwrap(await fetch(`${API_BASE}/watchlists/${id}/sharing`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ isPublic })
    }))
  }

  async addWork(token: string, id: number, idLibrary: number): Promise<void> {
    await unwrap(await fetch(`${API_BASE}/watchlists/${id}/works/${idLibrary}`, {
      method: 'PUT',
      headers: authHeaders(token)
    }))
  }

  async removeWork(token: string, id: number, idLibrary: number): Promise<void> {
    await unwrap(await fetch(`${API_BASE}/watchlists/${id}/works/${idLibrary}`, {
      method: 'DELETE',
      headers: authHeaders(token)
    }))
  }

  // Consultation publique : aucun jeton d'authentification requis.
  async getShared(shareToken: string): Promise<Watchlist> {
    return unwrap(await fetch(`${API_BASE}/watchlists/shared/${shareToken}`))
  }

  async follow(token: string, shareToken: string): Promise<Watchlist> {
    return unwrap(await fetch(`${API_BASE}/watchlists/shared/${shareToken}/follow`, {
      method: 'POST',
      headers: authHeaders(token)
    }))
  }

  async unfollow(token: string, id: number): Promise<void> {
    await unwrap(await fetch(`${API_BASE}/watchlists/${id}/follow`, { method: 'DELETE', headers: authHeaders(token) }))
  }
}

export default new WatchlistService()
