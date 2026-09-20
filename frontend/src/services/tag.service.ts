import { API_BASE } from './api'

export interface ClientTag {
  id: number
  label: string
  color: string | null
  works: number[]
}

export interface ClientTagList {
  tags: ClientTag[]
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

class TagService {
  async list(token: string): Promise<ClientTagList> {
    return unwrap(await fetch(`${API_BASE}/tags`, { headers: authHeaders(token) }))
  }

  async create(token: string, label: string, color?: string): Promise<ClientTag> {
    return unwrap(await fetch(`${API_BASE}/tags`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ label, color })
    }))
  }

  async remove(token: string, id: number): Promise<void> {
    await unwrap(await fetch(`${API_BASE}/tags/${id}`, { method: 'DELETE', headers: authHeaders(token) }))
  }

  async assign(token: string, id: number, idLibrary: number): Promise<void> {
    await unwrap(await fetch(`${API_BASE}/tags/${id}/works/${idLibrary}`, {
      method: 'PUT',
      headers: authHeaders(token)
    }))
  }

  async unassign(token: string, id: number, idLibrary: number): Promise<void> {
    await unwrap(await fetch(`${API_BASE}/tags/${id}/works/${idLibrary}`, {
      method: 'DELETE',
      headers: authHeaders(token)
    }))
  }
}

export default new TagService()
