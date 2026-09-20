import { API_BASE } from './api'

export interface LabelCount {
  label: string
  count: number
}

export interface ReadingStats {
  plan: string
  advancedUnlocked: boolean
  filtersUnlocked: boolean
  worksTracked: number
  ratedCount: number
  averageScore: number | null
  chaptersRead: number
  episodesWatched: number
  byStatus: LabelCount[]
  byType: LabelCount[]
  advanced: {
    topGenres: LabelCount[]
    scoreDistribution: { score: number; count: number }[]
    monthlyActivity: { month: string; count: number }[]
    topRated: { title: string; score: number }[]
  } | null
}

class StatsService {
  async get(token: string, filters: { type?: string; since?: string } = {}): Promise<ReadingStats> {
    const query = new URLSearchParams()
    if (filters.type) query.set('type', filters.type)
    if (filters.since) query.set('since', filters.since)
    const suffix = query.toString() ? `?${query}` : ''

    const response = await fetch(`${API_BASE}/stats${suffix}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.message || 'Erreur lors du chargement des statistiques')
    return data
  }
}

export default new StatsService()

export interface Badge {
  key: string
  value: number
  tier: 'bronze' | 'silver' | 'gold' | null
  earned: boolean
  next: number | null
  progress: number
}

export interface FriendRank {
  rank: number
  username: string
  avatarUrl: string | null
  worksTracked: number
  completed: number
  averageScore: number | null
  isMe: boolean
}

class GamificationService {
  async badges(token: string): Promise<Badge[]> {
    const response = await fetch(`${API_BASE}/badges`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!response.ok) throw new Error('Erreur lors du chargement des badges')
    return response.json()
  }

  async friendRanking(token: string): Promise<FriendRank[]> {
    const response = await fetch(`${API_BASE}/leaderboard/friends`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!response.ok) throw new Error('Erreur lors du chargement du classement')
    return response.json()
  }
}

export const gamificationService = new GamificationService()
