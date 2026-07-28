const getApiBase = (): string =>
  import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3000`

class LibraryService {
  // Infos du client connecté (dont libraryUsage : liste des oeuvres suivies)
  async getClientInfo(token: string): Promise<any> {
    const response = await fetch(`${getApiBase()}/client`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!response.ok) throw new Error(`Erreur client: ${response.status}`)
    return response.json()
  }

  // Ajoute une oeuvre à la bibliothèque du client. Ne throw pas sur 409 (déjà présente) : à l'appelant de gérer.
  async addToLibrary(token: string, payload: Record<string, any>): Promise<{ ok: boolean; status: number; data: any }> {
    const response = await fetch(`${getApiBase()}/library`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
    const data = await response.json().catch(() => ({}))
    return { ok: response.ok, status: response.status, data }
  }
}

export default new LibraryService()
