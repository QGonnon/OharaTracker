import { slugify } from '../utils'
import type { Manga, MediaKind } from '../types/index'

const getApiBase = (): string =>
  import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3000`

// Sources dont la présence dans `sites` indique un anime plutôt qu'un manga/lecture
const ANIME_SOURCES = ['moviedb', 'anime-sama']

class MangaService {
  async getAll(): Promise<Manga[]> {
    const response = await fetch(`${getApiBase()}/chapters`)
    if (!response.ok) throw new Error(`Erreur chapters: ${response.status}`)
    const chaptersMap: Record<string, any> = (await response.json()) || {}

    // Object.entries pour garder le libraryId (clé) et éviter les trous du tableau sparse
    return Object.entries(chaptersMap)
      .filter(([, m]) => m?.title)
      .map(([id, m]) => this.withDisplayFields({ ...m, id: Number(id) } as Manga))
  }

  findBySlug(mangas: Manga[], slug: string | string[]): Manga | undefined {
    return mangas.find(m => slugify(m.title) === slug)
  }

  // Chapitres/épisodes connus pour une entrée de bibliothèque donnée, toutes sources confondues
  async getChaptersForLibrary(idLibrary: number): Promise<{ chapter: string; url: string; site: string }[]> {
    const response = await fetch(`${getApiBase()}/chapters/${idLibrary}`)
    if (!response.ok) throw new Error(`Erreur chapters: ${response.status}`)
    return response.json()
  }

  // Le cover est soit hébergé localement (coverPath, servi via /cdn), soit une URL externe (coverUrl)
  getCoverUrl(manga: Pick<Manga, 'coverPath' | 'coverUrl' | 'title'>): string {
    if (manga.coverPath) return `${getApiBase()}/cdn/${manga.coverPath}`
    if (manga.coverUrl) return manga.coverUrl
    return `https://picsum.photos/seed/${manga.title}/400/600`
  }

  // Site qui possède le plus de chapitres, utilisé comme source "principale" du manga
  getBestSiteKey(manga: Manga): string {
    let bestKey = ''
    let maxChapters = 0
    for (const key in manga.sites) {
      if (manga.sites[key].chapters.length > maxChapters) {
        maxChapters = manga.sites[key].chapters.length
        bestKey = key
      }
    }
    return bestKey
  }

  // Dernier chapitre/épisode connu, dérivé de la meilleure source
  getLastChapterInfo(manga: Manga): { chapter?: string; chapterUrl?: string } {
    const bestKey = this.getBestSiteKey(manga)
    const bestSite = bestKey ? manga.sites[bestKey] : null
    const lastChapterEntry = bestSite?.chapters?.[0]
    return {
      chapter: lastChapterEntry?.chapter,
      chapterUrl: lastChapterEntry?.chapterUrl ?? lastChapterEntry?.url ?? bestSite?.chapterUrl,
    }
  }

  // Nombre total d'épisodes/saisons connus, déduit des chapitres (format "saison.episode") de la meilleure source
  getSeasonEpisodeStats(manga: Manga): { totalEpisodes?: number; totalSeasons?: number } {
    const bestKey = this.getBestSiteKey(manga)
    const chapters = bestKey ? manga.sites[bestKey]?.chapters : undefined
    if (!chapters || chapters.length === 0) return {}

    const seasons = new Set(
      chapters.map(c => c.chapter?.split('.')[0]).filter((s): s is string => Boolean(s))
    )
    return {
      totalEpisodes: chapters.length,
      totalSeasons: seasons.size || undefined,
    }
  }

  // Détecte si l'oeuvre est un anime : soit via le type BDD, soit via ses sources (moviedb, anime-sama, ...)
  isAnimeType(manga: Pick<Manga, 'type' | 'sites'>): boolean {
    const type = manga.type?.toLowerCase()
    if (type === 'anime' || type === 'serie') return true
    return Object.keys(manga.sites || {}).some(source => ANIME_SOURCES.includes(source))
  }

  // Résout le MediaKind depuis le nom de route ou le champ type BDD
  resolveMediaKind(routeName: string | symbol | null | undefined, dbType?: string): MediaKind {
    const name = String(routeName || '').toLowerCase()

    // Priorité : nom de route explicite (nouvelles routes)
    if (name.includes('lecture')) return 'lecture'
    if (name.includes('serie')) return 'serie'
    if (name.includes('film')) return 'film'

    // Fallback : champ type BDD (migration en cours par le collègue)
    if (dbType) {
      const t = dbType.toLowerCase()
      if (t === 'lecture') return 'lecture'
      if (t === 'serie') return 'serie'
      if (t === 'film') return 'film'
      // Anciens types
      if (t === 'anime') return 'serie'
      if (t === 'manga') return 'lecture'
    }

    // Fallback : anciennes routes
    if (name.includes('anime')) return 'serie'
    return 'lecture' // défaut
  }

  // Ajoute les champs plats (site/lastChapter/chapterUrl) dérivés de la meilleure source, pour la commodité des templates
  private withDisplayFields(manga: Manga): Manga {
    const bestKey = this.getBestSiteKey(manga)
    const { chapter, chapterUrl } = this.getLastChapterInfo(manga)
    return {
      ...manga,
      site: bestKey || undefined,
      lastChapter: chapter,
      chapterUrl,
    }
  }
}

export default new MangaService()
