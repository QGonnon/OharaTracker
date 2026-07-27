import { slugify } from '../utils'
import type { Manga } from '../types/index'

const getApiBase = (): string =>
  import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3000`

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

  // Ajoute les champs plats (site/lastChapter/chapterUrl) dérivés de la meilleure source, pour la commodité des templates
  private withDisplayFields(manga: Manga): Manga {
    const bestKey = this.getBestSiteKey(manga)
    const bestSite = bestKey ? manga.sites[bestKey] : null
    const lastChapterEntry = bestSite?.chapters?.[0]
    return {
      ...manga,
      site: bestKey || undefined,
      lastChapter: lastChapterEntry?.chapter,
      chapterUrl: lastChapterEntry?.chapterUrl ?? lastChapterEntry?.url ?? bestSite?.chapterUrl,
    }
  }
}

export default new MangaService()
