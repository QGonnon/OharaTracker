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

  // Met à jour l'entrée de bibliothèque de l'utilisateur connecté (chapitre lu, statut, notifications...)
  async updateLibraryEntry(token: string, payload: Record<string, any>): Promise<any> {
    const response = await fetch(`${getApiBase()}/library/user`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Erreur' }))
      throw new Error(err.message || 'Erreur lors de la sauvegarde')
    }
    return response.json().catch(() => ({}))
  }

  // Supprime une oeuvre de la bibliothèque de l'utilisateur connecté
  async deleteFromLibrary(token: string, payload: Record<string, any>): Promise<void> {
    const response = await fetch(`${getApiBase()}/library/user`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Erreur' }))
      throw new Error(err.message || 'Erreur lors de la suppression')
    }
  }
}

export default new LibraryService()
