import { API_BASE } from './api'

export interface CommunityProfile {
  username: string
  avatarUrl: string | null
  bannerUrl?: string | null
  /** null quand le profil est privé et n'est pas encore un ami : l'activité est masquée. */
  worksTracked: number | null
  averageScore?: number | null
  friendStatus: 'none' | 'pending' | 'accepted' | 'self'
  isPublic?: boolean
  activity?: FeedEntry[]
}

export interface FeedEntry {
  username?: string
  avatarUrl?: string | null
  type: 'added' | 'progress' | 'rated' | 'completed'
  detail: string | null
  createdAt: string
  idLibrary: number
  title: string
  mediaType: string | null
}

export interface FriendLists {
  friends: CommunityProfile[]
  sent: CommunityProfile[]
  received: CommunityProfile[]
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

class CommunityService {
  async search(token: string, query: string): Promise<CommunityProfile[]> {
    return unwrap(await fetch(`${API_BASE}/community/search?q=${encodeURIComponent(query)}`, {
      headers: authHeaders(token)
    }))
  }

  async feed(token: string): Promise<FeedEntry[]> {
    return unwrap(await fetch(`${API_BASE}/community/feed`, { headers: authHeaders(token) }))
  }

  async friends(token: string): Promise<FriendLists> {
    return unwrap(await fetch(`${API_BASE}/community/friends`, { headers: authHeaders(token) }))
  }

  async profile(token: string, username: string): Promise<CommunityProfile> {
    return unwrap(await fetch(`${API_BASE}/community/profile/${encodeURIComponent(username)}`, {
      headers: authHeaders(token)
    }))
  }

  async request(token: string, username: string): Promise<{ status: string }> {
    return unwrap(await fetch(`${API_BASE}/community/friends/${encodeURIComponent(username)}`, {
      method: 'POST',
      headers: authHeaders(token)
    }))
  }

  async accept(token: string, username: string): Promise<{ status: string }> {
    return unwrap(await fetch(`${API_BASE}/community/friends/${encodeURIComponent(username)}`, {
      method: 'PATCH',
      headers: authHeaders(token)
    }))
  }

  async remove(token: string, username: string): Promise<void> {
    await unwrap(await fetch(`${API_BASE}/community/friends/${encodeURIComponent(username)}`, {
      method: 'DELETE',
      headers: authHeaders(token)
    }))
  }

  async setVisibility(token: string, isPublic: boolean): Promise<{ isPublic: boolean }> {
    return unwrap(await fetch(`${API_BASE}/community/visibility`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ isPublic })
    }))
  }
}

export default new CommunityService()
